class Blog < ActiveRecord::Base
  require 'open-uri'
  require 'net/http'
  require 'addressable/uri'
  require 'soundcloud'

  attr_accessible :url
  attr_protected :favicon_url, :feed, :name

  validate :has_working_url
  validate :has_working_feed
  validates :url, :uniqueness => true

  before_validation :get_feed_url

  before_save :pull_data

  has_many :posts, foreign_key: "blog_id", dependent: :destroy

  # Properly formats url for favicon and blog
  # Called by :has_working_url
	def format_urls
		uri = Addressable::URI.parse(self.url)
		self.favicon_url = "http://www.google.com/s2/favicons?domain=#{uri.host}"
		return self.url = "#{uri.scheme}://#{uri.host}"
	end

	def has_working_url
		url = URI.parse(self.format_urls)
	  Net::HTTP.start(url.host, url.port) do |http|
  		unless http.head(url.request_uri).code == "200"
        errors.add(:invalid_url, "The blog url you entered is unresponsive or invalid")
      end
		end
	end

  def has_working_feed
    puts "has_working_feed called"
    if self.feed.blank?
      return errors.add(:invalid_rss_feed, "The site you entered has no rss feed")
    end
    agent = Mechanize.new
    begin
      unless agent.get(self.feed).class == Mechanize::XmlFile
        errors.add(:invalid_rss_feed, "The site you entered does not have a valid rss feed")
      end
    rescue
      errors.add(:invalid_rss_feed, "The site you entered does not have a valid rss feed")
    end
  end

  def self.update_all
    Blog.all.each do |blog|
      blog.update
    end
  end

  def update
    feed = Feedzirra::Feed.fetch_and_parse(self.feed)
    self.name= feed.title
    self.url= feed.url
    format_urls
    add_entries(feed.entries, self.id)
  end

  def get_feed_url
    begin
      doc = Nokogiri::HTML(open(self.url))
    rescue
      puts "Error fetching feed url from #{self.url}"
      return self.feed = nil
    end

    link = doc.css("link").select{|link| link['type'] =='application/rss+xml'}.first
    if link.blank? && self.feed.blank?
      self.feed = "#{self.url}/feed"
    elsif self.feed.blank?
      self.feed = link['href']
    end
  end

  private

	def pull_data
		feed = Feedzirra::Feed.fetch_and_parse(self.feed)
		self.name = feed.title
	end

  def add_entries(entries, blog_id)
    entries.each do |entry|
      unless Post.exists?(:url => entry.url)
        post = Post.new(url: entry.url, blog_id: blog_id, post_date: entry.published)
        if entry.content.blank? && !entry.summary.blank?
          post.content = entry.summary
        else
          post.content = entry.content
        end
        track_ids = parse_post(entry.url, entry.published)
        puts track_ids
        post.track_urls = track_ids
        unless track_ids.blank?
          post.save!
          track_ids.each do |id| 
            link = Link.new(post_id: post.id, song_id: id)
            link.save!
          end
        end
      end
    end
  end


  def parse_post(post_url, post_date)
    song_ids = []   # song.id attrs from ActiveRecord
    agent = Mechanize.new
    client = Soundcloud.new(client_id: "880d97d3bef306f045f77502727fefc2")

    begin
      page = agent.get(post_url)
    rescue
      puts "Error: invalid post_url"
      return nil
    end

    links = page.links_with(href: %r{soundcloud})
    iframes = page.iframes_with(src: %r{soundcloud})

    track_urls = (links + iframes).map {|e| e.href.scan(/\/tracks\/\d+|\/playlists\/\d+/)}.flatten

    puts track_urls

    track_urls.each do |url|
      begin
        sound = client.get(url)
      rescue
        return nil
      end

      if sound.kind == "track"
        song_ids.push(create_song(sound.permalink_url, post_date, client))
      elsif sound.kind == "playlist"
        sound.tracks.each do |track|
          song_ids.push(create_song(track.permalink_url, post_date, client))
        end
      end
    end

    return song_ids
  end

  # Parses feed entry given an entry_url for songs in each post
  # Returns an array of all the track ids associated with the posted songs
  # def parse_entry(entry_url, post_date)
  #   track_ids = []
  #   begin
  #     uri = open(entry_url)
  #   rescue
  #     return nil
  #   end
  #   doc = Nokogiri::HTML(uri.read)
  #   doc.encoding = 'utf-8'
  #   client = Soundcloud.new(client_id: "880d97d3bef306f045f77502727fefc2")

  #   p doc.xpath("//a[contains(@href, 'soundcloud')]")
  #   # parses doc for href's containing "soundcloud" and processes those which are tracks or playlists
  #   doc.xpath("//a[contains(@href, 'soundcloud')]").each do |link|
  #     # puts link
  #     url = link["href"]
  #     url.slice! "/download"
  #     if url.include? "//api"
  #       begin
  #         sound = client.get(url.scan(/\/tracks\/[0-9]+/).first)
  #       rescue
  #         return nil
  #       end
  #     else
  #       begin
  #         sound = client.get('/resolve', url: url)
  #       rescue
  #         return nil
  #       end
  #     end
  #     if sound.kind == "track"
  #       track_ids.push(create_song(sound.permalink_url, post_date, client))
  #     elsif sound.kind == "playlist"
  #       sound.tracks.each do |track|
  #         track_ids.push(create_song(track.permalink_url, post_date, client))
  #       end
  #     end
  #   end

  #   # parses doc for iframe src's containing "soundcloud" and processes those which are tracks or playlists
  #   puts "iframe"
  #   puts "iframe: " + doc.xpath("//iframe[contains(@src, 'soundcloud')]")
  #   doc.xpath("//iframe[contains(@src, 'soundcloud')]").each do |link|
  #     puts link
  #     if !link['src'].gsub(/%2F/, "/").scan(/\/tracks\/[0-9]+/).first.blank?
  #       if link['src'].gsub(/%2F/, "/").scan(/secret_token/).first.blank?
  #         begin
  #           track = client.get(link['src'].gsub(/%2F/, "/").scan(/\/tracks\/[0-9]+/).first)
  #         rescue
  #           return nil
  #         end
  #         track_ids.push(create_song(track.permalink_url, post_date, client))
  #       end
  #     elsif !link['src'].gsub(/%2F/, "/").scan(/\/playlists\/[0-9]+/).first.blank?
  #       begin
  #         playlist = client.get(link['src'].gsub(/%2F/, "/").scan(/\/playlists\/[0-9]+/).first)
  #       rescue
  #         return nil
  #       end
  #       playlist.tracks.each do |track|
  #         track_ids.push(create_song(track.permalink_url, post_date, client))
  #       end
  #     end
  #   end

  #   return track_ids
  # end

  # Searches for a song with :url => track_url and creates it if it doesn't exist
  # Returns the id of the song with the matching track_url
  def create_song(track_url, last_posting, client)
    unless Song.exists?(:url => track_url)
      track = client.get('/resolve', url: track_url)
      song = Song.new
      song.title= track.title
      song.artist= track.user.username
      song.url= track.permalink_url
      song.icon_url= track.artwork_url
      song.track_id= track.id
      song.genre= track.genre
      song.times_favorited= 0
      song.last_posting= last_posting
      song.save!
      return song.id
    end
    song = Song.where(url: track_url).first
    song.last_posting= last_posting
    song.save!
    return song.id
  end
end
