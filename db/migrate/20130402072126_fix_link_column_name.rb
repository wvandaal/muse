class FixLinkColumnName < ActiveRecord::Migration
  def change
    rename_column :links, :track_id, :song_id
  end
end
