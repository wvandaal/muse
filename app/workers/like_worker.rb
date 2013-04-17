class LikeWorker
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
		if @user.likes?(@song)
			@user.unlike(@song)
		else
			@user.like(@song)
		end
	end
end