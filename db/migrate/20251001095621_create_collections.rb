class CreateCollections < ActiveRecord::Migration[8.0]
  def change
    create_table :collections do |t|
      t.string :name
      t.string :contract_address
      t.string :slug

      t.timestamps
    end
  end
end
