require "/Users/wcvandal/Documents/Computer Science/Senior Project/muse/config/environment.rb"

client = Soundcloud.new(client_id: "880d97d3bef306f045f77502727fefc2")
tracks = client.get('/tracks', :limit => 10, :order => 'hotness')
tracks.each do |track|
	song = Song.new
	song.title= track.title
	song.artist= track.user.username
	song.url= track.permalink_url
	song.icon_url= track.artwork_url
	song.track_id= track.id
	song.genre= track.genre
	song.times_favorited= track.favoritings_count
	song.save!
end