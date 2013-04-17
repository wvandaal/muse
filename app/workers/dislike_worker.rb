class DislikeWorker
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
		if @user.dislikes?(@song)
			@user.undislike(@song)
		else
			@user.dislike(@song)
		end
	end
end