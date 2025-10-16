class GraphAsset
  attr_accessor :result

  def initialize(result:)
    @result = result
  end

  def name
    result['domain']['name']
  end

  def expires_at
    Time.at(result['expiryDate'].to_i)
  end

  def name_without_suffix
    name.sub(/\.eth\z/i, '')
  end

  def wrapped?(data)
    result['registrant']['id'].downcase ==  Ethereum::Chain::ENS_WRAPPER_ADDRESS.downcase
  end

  def contract_address
    wrapped?(result) ? Ethereum::Chain::ENS_WRAPPER_ADDRESS : Ethereum::Chain::ENS_CONTRACT_ADDRESS
  end

  def current_premium_usd
    EnsPremiumCalculator.new.current_premium(self.expires_at)
  end

  def registration_price_usd
    return 5 if name.length >= 5
    return 160 if name.length == 4

    640
  end

  def premium_ends_at
    expires_at + 90.days + 21.days
  end

  def token_id
    GetTokenId.new(contract_address: contract_address, name: name).call
  end
end
