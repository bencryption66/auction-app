class GetAuctionInfo
  include Callable
  call_attributes :nft_address, :token_id, :contract_address

  def call
    ReadContract.call(
      rpc_url: Ethereum::Chain::RPC_URL,
      contract_address:,
      abi:,
      function_name: 'getAuction',
      args: [nft_address, token_id_big_number]
    )
  end

  private

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
        "name": "getAuction",
        "outputs": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "seller",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "nft",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
              },
              {
                "internalType": "uint128",
                "name": "startPriceUSD",
                "type": "uint128"
              },
              {
                "internalType": "uint32",
                "name": "startTime",
                "type": "uint32"
              },
              {
                "internalType": "uint16",
                "name": "durationDays",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "feeBps",
                "type": "uint16"
              },
              {
                "internalType": "bool",
                "name": "settled",
                "type": "bool"
              },
              {
                "internalType": "address",
                "name": "buyer",
                "type": "address"
              },
              {
                "internalType": "uint128",
                "name": "salePriceETH",
                "type": "uint128"
              },
              {
                "internalType": "enum ExponentialDutchAuction.TokenStandard",
                "name": "tokenStandard",
                "type": "uint8"
              }
            ],
            "internalType": "struct ExponentialDutchAuction.Auction",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  end
end
