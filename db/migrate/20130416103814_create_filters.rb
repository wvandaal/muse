class CreateFilters < ActiveRecord::Migration
  def change
    drop_table :filters

    create_table :filters do |t|
      t.integer :user_id
      t.boolean :include
      t.string :genre
      t.integer :likes_min
      t.integer :likes_max
      t.integer :dislikes_min
      t.integer :dislikes_max
      t.integer :favorites_min
      t.integer :favorites_max
      t.string :artist

      t.timestamps
    end
  end
end
