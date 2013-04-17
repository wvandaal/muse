class CreatePosts < ActiveRecord::Migration
  def change
    create_table :posts do |t|
      t.integer :blog_id
      t.string :url
      t.string :content
      t.datetime :post_date
      t.string :track_urls

      t.timestamps
    end
  end
end
