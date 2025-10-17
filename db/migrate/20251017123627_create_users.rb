class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :ethereum_address
      t.string :name
      t.string :email
      t.string :avatar_url
      t.datetime :last_sign_in_at

      t.timestamps
    end
    add_index :users, :ethereum_address, unique: true
  end
end
