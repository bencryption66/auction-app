class CreateAssets < ActiveRecord::Migration[8.0]
  def change
    create_table :assets do |t|
      t.string :name
      t.references :collection, null: false, foreign_key: true
      t.string :token_id
      t.datetime :expires_at
      t.datetime :registered_at

      t.timestamps
    end
  end
end
