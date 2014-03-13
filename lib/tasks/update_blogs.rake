task :update_feed => :environment do
  puts "Updating blogs..."
  Blog.update_all
  puts "done."
end