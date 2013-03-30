require "/Users/wcvandal/Documents/Computer Science/Senior Project/muse/config/environment.rb"

blog = Blog.find(2)  #DML
blog2 = Blog.find(6) #Kollection

doc = Nokogiri::HTML(open(blog.url))
client = Soundcloud.new(client_id: "880d97d3bef306f045f77502727fefc2")

client.get('/tracks/2F84719228')

#doc.xpath("//a[contains(@href, 'soundcloud')]").each do |link|
#	track = client.get('/resolve', url: link['href'])
#	puts track.title
#end


