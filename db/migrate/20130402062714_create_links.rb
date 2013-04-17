class CreateLinks < ActiveRecord::Migration
  def change
    create_table :links do |t|
      t.integer :post_id
      t.integer :track_id

      t.timestamps
    end
  end
end
