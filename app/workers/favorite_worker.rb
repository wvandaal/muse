class FavoriteWorker
	include Sidekiq::Worker
	sidekiq_options ({
		queue: "recommendable",
		retry: false,
		unique: :all,
		forever: true
	})

	def perform(user_id, song_id)
		@song = Song.find(song_id)
		@user = User.find(user_id)
		if @user.bookmarks?(@song)
			@user.unbookmark(@song)
			@song.times_favorited = (@song.times_favorited - 1)
		else
			@user.bookmark(@song)
			@song.times_favorited = (@song.times_favorited + 1)
		end
	end
end