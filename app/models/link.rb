class Link < ActiveRecord::Base
  attr_accessible :song_id, :post_id

  belongs_to :post
  belongs_to :song
end
