class CreateSongs < ActiveRecord::Migration
  def change
    create_table :songs do |t|
      t.string :title
      t.string :artist
      t.string :url
      t.string :icon_url
      t.integer :track_id
      t.string :genre
      t.integer :plays
      t.integer :times_favorited

      t.timestamps
    end
  end
end
