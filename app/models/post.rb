class Post < ActiveRecord::Base
  attr_accessible :url, :blog_id, :post_date
  serialize :track_urls, Array

  has_many :links, dependent: :destroy
  has_many :songs, through: :links, uniq: true
end
