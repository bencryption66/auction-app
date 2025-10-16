class AddContractAddressToAuctions < ActiveRecord::Migration[8.0]
  def change
    add_column :auctions, :contract_address, :string
  end
end
