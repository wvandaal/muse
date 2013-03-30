class Song < ActiveRecord::Base
  attr_accessible :artist, :genre, :icon_url, :plays, :times_favorited, :title, :track_id, :url
end
