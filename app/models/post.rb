class Post < ActiveRecord::Base
  serialize :track_urls, Array

  has_many :links, dependent: :destroy
  has_many :songs, through: :links, uniq: true
end
