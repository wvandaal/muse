class AddNameToFilters < ActiveRecord::Migration
  def change
  	add_column :filters, :name, :string
  end
end
