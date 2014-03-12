require "/Users/wcvandal/Documents/ComputerScience/Senior Project/muse/config/environment.rb"

def add_entries(entries, blog_id)
	entries.each do |entry|
		unless Post.exists?(:url => entry.url)
			post = Post.new
			post.url= entry.url
			post.blog_id= blog_id
			post.content= entry.content
			post.track_urls= parse_entry(entry.url)
			if post.track_urls != nil
				post.save!
			end
		end
	end
end

def parse_entry(entry_url)
	urls = []
	doc = Nokogiri::HTML(open(entry_url))
	doc.xpath("//a[contains(@href, 'soundcloud')]").each do |link|
		track = client.get('/resolve', url: link['href'])
		urls.push(track.permalink_url)
		create_song(track.permalink_url)
	end
	doc.xpath("//iframe[contains(@src, 'soundcloud')]").each do |link|
		track = client.get(link['src'].gsub(/%2F/, "/").scan(/\/tracks\/[0-9]+/).first)
		urls.push(track.permalink_url)
		create_song(track.permalink_url)
	end
	return urls
end



def create_song(track_url)
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
		song.save!
	end
end

blogs = Blog.all
client = Soundcloud.new(client_id: "880d97d3bef306f045f77502727fefc2")

blogs.each do |blog|
	feed = Feedzirra::Feed.fetch_and_parse(blog.feed)
	add_entries(feed.entries, blog.id)
end

# parses html when links are embeded in iframe
#doc2.xpath("//iframe[contains(@src, 'soundcloud')]").each{ |link| puts link['src'].gsub(/%2F/, "/").scan(/tracks\/[0-9]+/) }


#parses html when links are in anchor tags
#doc.xpath("//a[contains(@href, 'soundcloud')]").each do |link|
#	track = client.get('/resolve', url: link['href'])
#	puts track.title
#end
