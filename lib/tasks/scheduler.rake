desc "This task is called by the Heroku scheduler add-on"
task :update_blogs => :environment do
  puts "Updating blogs..."
  Blog.update_all
  puts "done."
end