class GetAuctionCurrentPriceView
  include Callable
  call_attributes :nft_address, :token_id, :contract_address

  def call
    is_active, is_expired, price = response
    {
      isActive: is_active,
      isExpired: is_expired,
      priceWei: price.to_i
    }
  rescue StandardError => e
    Rails.logger.error("Error fetching current price view: #{e.message}")
    { isActive: false, isExpired: true, price: 0 }
  end

  private

  def response
    @response ||= call_contract
  end

  def call_contract
    ReadContract.call(
      rpc_url: Ethereum::Chain::RPC_URL,
      contract_address:,
      abi:,
      function_name: 'currentPriceView',
      args: [nft_address, token_id_big_number]
    )
  end

  def token_id_big_number
    token_id.to_i
  end

  def abi
    [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "nft",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "currentPriceView",
        "outputs": [
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isExpired",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
    ]
  end
end
