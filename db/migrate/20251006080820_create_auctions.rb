class CreateAuctions < ActiveRecord::Migration[8.0]
  def change
    create_table :auctions do |t|
      t.references :asset, null: false, foreign_key: true
      t.string :creator
      t.datetime :started_at
      t.datetime :ends_at

      t.timestamps
    end
  end
end
