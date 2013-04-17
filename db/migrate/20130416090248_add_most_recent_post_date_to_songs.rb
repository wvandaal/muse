class AddMostRecentPostDateToSongs < ActiveRecord::Migration
  def change
  	add_column :songs, :last_posting, :datetime
  end
end
