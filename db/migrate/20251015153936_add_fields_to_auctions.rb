class AddFieldsToAuctions < ActiveRecord::Migration[8.0]
  def change
    add_column :auctions, :nft_address, :string
    add_column :auctions, :token_id, :string
    add_column :auctions, :domain_name, :string
    add_column :auctions, :seller, :string
    add_column :auctions, :start_price_usd, :string
    add_column :auctions, :start_time, :string
    add_column :auctions, :duration_days, :string
    add_column :auctions, :fee_bps, :string
    add_column :auctions, :settled, :boolean, default: false
    add_column :auctions, :buyer, :string
    add_column :auctions, :sale_price_eth, :string
    add_column :auctions, :token_standard, :string

    # Add indexes for commonly queried fields
    add_index :auctions, :nft_address
    add_index :auctions, :token_id
    add_index :auctions, :seller
    add_index :auctions, :settled
  end
end
