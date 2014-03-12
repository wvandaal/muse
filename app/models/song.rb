class Song < ActiveRecord::Base
  attr_accessible :times_favorited
  has_many :links
  has_many :posts, through: :links, uniq: true

  def most_recent_post
  	return self.posts.order("post_date DESC").first
  end
end
