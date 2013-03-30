class Blog < ActiveRecord::Base
  require 'open-uri'
  require 'net/http'
  require "addressable/uri"

  attr_accessible :url
  attr_protected :favicon_url, :feed, :name

  validate :has_working_url

  before_save :pull_data

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

  private
  	def pull_data
		doc = Nokogiri::HTML(open(self.url))
  		self.feed = doc.css("link").select{|link| link['type'] =='application/rss+xml'}.first['href']
  		feed = Feedzirra::Feed.fetch_and_parse(self.feed)
  		self.name = feed.title
  	end
end
