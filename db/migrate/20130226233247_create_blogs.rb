class CreateBlogs < ActiveRecord::Migration
  def change
    create_table :blogs do |t|
      t.string :url
      t.string :feed
      t.string :name
      t.string :favicon_url

      t.timestamps
    end
  end
end
