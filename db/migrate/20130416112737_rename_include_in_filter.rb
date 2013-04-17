class RenameIncludeInFilter < ActiveRecord::Migration
  def change
  	rename_column :filters, :include, :inclusive
  end
end
