class AddFilterColumnToUsers < ActiveRecord::Migration
  def change
  	add_column :users, :filters_enabled, :boolean, default: false
  end
end
