class FollowWorker
	include Sidekiq::Worker
	sidekiq_options ({
		queue: "recommendable",
		unique: :all,
		forever: true
	})

	def perform(user_id, blog_id)
		@blog = Blog.find(blog_id)
		@user = User.find(user_id)
		if @user.bookmarks?(@blog)
			@user.unbookmark(@blog)
		else
			@user.bookmark(@blog)
		end
	end
end