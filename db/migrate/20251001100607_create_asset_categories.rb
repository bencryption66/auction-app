class CreateAssetCategories < ActiveRecord::Migration[8.0]
  def change
    create_table :asset_categories do |t|
      t.references :asset, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true

      t.timestamps
    end
  end
end
