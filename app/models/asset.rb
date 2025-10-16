class Asset < ApplicationRecord
  belongs_to :collection
  has_many :asset_categories
  has_many :categories, through: :asset_categories
  has_many :auctions, dependent: :destroy

  scope :in_premium_period, -> {
    where('expires_at IS NOT NULL')
      .where('expires_at <= ?', 90.days.ago)
      .where('expires_at + INTERVAL 111 DAY >= ?', Time.current)
  }

  def name_without_suffix
    name.sub(/\.eth\z/i, '')
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
    GetTokenId.new(contract_address: collection.contract_address, name: name).call
  end
end
