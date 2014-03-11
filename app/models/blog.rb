class Blog < ActiveRecord::Base
  require 'open-uri'
  require 'net/http'
  require "addressable/uri"
  require 'soundcloud'

  attr_accessible :url
  attr_protected :favicon_url, :feed, :name

  validate :has_working_url
  validates :url, :uniqueness => true

  before_save :pull_data

  has_many :posts, foreign_key: "blog_id", dependent: :destroy

	def format_urls
		uri = Addressable::URI.parse(self.url)
		self.favicon_url = "http://www.google.com/s2/favicons?domain=#{uri.host}"
		return self.url = "#{uri.scheme}://#{uri.host}"
	end

	def has_working_url
		url = URI.parse(self.format_urls)
	  	Net::HTTP.start(url.host, url.port) do |http|
  		return http.head(url.request_uri).code == "200"
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

  private
  	def pull_data
		  doc = Nokogiri::HTML(open(self.url))
      link = doc.css("link").select{|link| link['type'] =='application/rss+xml'}.first
      if link.blank? && self.feed.blank?
        self.feed = "#{self.url}/feed"
  		elsif self.feed.blank?
        self.feed = link['href']
      end
  		feed = Feedzirra::Feed.fetch_and_parse(self.feed)
  		self.name = feed.title
  	end

    def validate_feed(feed_url)
      url = URI.parse(feed_url)
      Net::HTTP.start(url.host, url.port) do |http|
        return http.head(url.request_uri).code == "200"
      end
    end


    def add_entries(entries, blog_id)
      entries.each do |entry|
        unless Post.exists?(:url => entry.url)
          post = Post.new
          post.url= entry.url
          post.blog_id= blog_id
          if entry.content.blank? && !entry.summary.blank?
            post.content= entry.summary
          else
            post.content= entry.content
          end
          post.post_date= entry.published
          track_ids = parse_entry(entry.url, entry.published)
          post.track_urls= track_ids
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

  # Parses feed entry given an entry_url for songs in each post
  # Returns an array of all the track ids associated with the posted songs
  def parse_entry(entry_url, post_date)
    track_ids = []
    begin
      uri = open(entry_url)
    rescue
      return nil
    end
    doc = Nokogiri::HTML(uri.read)
    doc.encoding = 'utf-8'
    client = Soundcloud.new(client_id: "880d97d3bef306f045f77502727fefc2")

    # parses doc for href's containing "soundcloud" and processes those which are tracks or playlists
    doc.xpath("//a[contains(@href, 'soundcloud')]").each do |link|
      puts link
      url = link["href"]
      url.slice! "/download"
      if url.include? "//api"
        begin
          sound = client.get(url.scan(/\/tracks\/[0-9]+/).first)
        rescue
          return nil
        end
      else
        begin
          sound = client.get('/resolve', url: url)
        rescue
          return nil
        end
      end
      if sound.kind == "track"
        track_ids.push(create_song(sound.permalink_url, post_date, client))
      elsif sound.kind == "playlist"
        sound.tracks.each do |track|
          track_ids.push(create_song(track.permalink_url, post_date, client))
        end
      end
    end

    # parses doc for iframe src's containing "soundcloud" and processes those which are tracks or playlists
    doc.xpath("//iframe[contains(@src, 'soundcloud')]").each do |link|
      puts link
      if !link['src'].gsub(/%2F/, "/").scan(/\/tracks\/[0-9]+/).first.blank?
        if link['src'].gsub(/%2F/, "/").scan(/secret_token/).first.blank?
          begin
            track = client.get(link['src'].gsub(/%2F/, "/").scan(/\/tracks\/[0-9]+/).first)
          rescue
            return nil
          end
          track_ids.push(create_song(track.permalink_url, post_date, client))
        end
      elsif !link['src'].gsub(/%2F/, "/").scan(/\/playlists\/[0-9]+/).first.blank?
        begin
          playlist = client.get(link['src'].gsub(/%2F/, "/").scan(/\/playlists\/[0-9]+/).first)
        rescue
          return nil
        end
        playlist.tracks.each do |track|
          track_ids.push(create_song(track.permalink_url, post_date, client))
        end
      end
    end

    return track_ids
  end

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
