class AddDefaultValueToNameInFilters < ActiveRecord::Migration
  def change
  	change_column :filters, :name, :string, default: "Untitled Filter"
  end
end
