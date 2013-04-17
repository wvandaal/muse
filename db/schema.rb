# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20130417051030) do

  create_table "blogs", :force => true do |t|
    t.string   "url"
    t.string   "feed"
    t.string   "name"
    t.string   "favicon_url"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
  end

  create_table "filters", :force => true do |t|
    t.integer  "user_id"
    t.boolean  "inclusive"
    t.string   "genre"
    t.integer  "likes_min"
    t.integer  "likes_max"
    t.integer  "dislikes_min"
    t.integer  "dislikes_max"
    t.integer  "favorites_min"
    t.integer  "favorites_max"
    t.string   "artist"
    t.datetime "created_at",                                   :null => false
    t.datetime "updated_at",                                   :null => false
    t.string   "name",          :default => "Untitled Filter"
  end

  create_table "links", :force => true do |t|
    t.integer  "post_id"
    t.integer  "song_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "posts", :force => true do |t|
    t.integer  "blog_id"
    t.string   "url"
    t.string   "content"
    t.datetime "post_date"
    t.string   "track_urls"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "songs", :force => true do |t|
    t.string   "title"
    t.string   "artist"
    t.string   "url"
    t.string   "icon_url"
    t.integer  "track_id"
    t.string   "genre"
    t.integer  "plays"
    t.integer  "times_favorited"
    t.datetime "created_at",      :null => false
    t.datetime "updated_at",      :null => false
    t.datetime "last_posting"
    t.integer  "like_count"
    t.integer  "dislike_count"
  end

  create_table "taggings", :force => true do |t|
    t.integer  "tag_id"
    t.integer  "taggable_id"
    t.string   "taggable_type"
    t.integer  "tagger_id"
    t.string   "tagger_type"
    t.string   "context",       :limit => 128
    t.datetime "created_at"
  end

  add_index "taggings", ["tag_id"], :name => "index_taggings_on_tag_id"
  add_index "taggings", ["taggable_id", "taggable_type", "context"], :name => "index_taggings_on_taggable_id_and_taggable_type_and_context"

  create_table "tags", :force => true do |t|
    t.string "name"
  end

  create_table "users", :force => true do |t|
    t.string   "uid"
    t.string   "name"
    t.string   "oauth_token"
    t.datetime "oauth_expires_at"
    t.datetime "created_at",                          :null => false
    t.datetime "updated_at",                          :null => false
    t.string   "img_url"
    t.boolean  "filters_enabled",  :default => false
  end

end
