# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

urls = [
  "http://thekollection.com/",
  "http://cavemansound.com",
  "http://freshnewtracks.com",
  "http://allthingsgomusic.com/"
]

urls.each {|url| Blog.create({url: url})}
Blog.update_all