class AddLikesCountToSongs < ActiveRecord::Migration
  def change
  	add_column :songs, :like_count, :integer
  	add_column :songs, :dislike_count, :integer
  end
end
