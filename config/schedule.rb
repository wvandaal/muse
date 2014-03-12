# Cron job - updates all blogs every 15 minutes
every 15.minutes do
	runner "Blog.update_all", environment: 'development'
end
