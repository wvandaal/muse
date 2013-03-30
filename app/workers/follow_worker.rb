class FollowWorker
	include Sidekiq::Worker
	sidekiq_options ({
		queue: "recommendable",
		retry: false,
		unique: :all,
		forever: true
	})

	def perform(user_id, blog_id)
		@blog = Blog.find(blog_id)
		@user = User.find(user_id)
		if @user.likes?(@blog)
			@user.unlike(@blog)
		else
			@user.like(@blog)
		end
	end
end