class Auction < ApplicationRecord
  belongs_to :asset, optional: true  # Make optional since you're storing blockchain data directly

  validates :nft_address, presence: true
  validates :token_id, presence: true
  validates :seller, presence: true
  validates :start_price_usd, presence: true
  validates :duration_days, presence: true

  # Add scopes for common queries
  scope :expired, -> { where("start_time + (duration_days * 24 * 60 * 60) < ?", Time.now.to_i) }
  scope :not_expired, -> { where("start_time + (duration_days * 24 * 60 * 60) >= ?", Time.now.to_i) }
  scope :active, -> { where(settled: false) }
  scope :settled, -> { where(settled: true) }
  scope :by_seller, ->(address) { where(seller: address) }

  # Helper methods
  def active?
    !settled?
  end

  def start_price_usd_decimal
    start_price_usd.to_f / 1e18
  end

  def sale_price_eth_decimal
    return 0 if sale_price_eth.blank?
    sale_price_eth.to_f / 1e18
  end

  def time_remaining
    return 0 if settled?
    end_time = start_time.to_i + (duration_days.to_i * 24 * 60 * 60)
    remaining = end_time - Time.now.to_i
    remaining.positive? ? remaining : 0
  end

  def expired?
    time_remaining <= 0
  end

  def current_price_usd
    return 0 if expired?

    EnsPremiumCalculator.new(start_premium: start_price_usd_decimal.to_i, total_days: duration_days.to_i).current_premium_from_time_remaining(time_remaining)
  end

  def auction_info
    GetAuctionInfo.call(nft_address:, token_id:, contract_address:)
  end

  def current_price_view
    GetAuctionCurrentPriceView.call(nft_address:, token_id:, contract_address:)
  end

  def update_auction_info!
    info = auction_info
    return unless info

    self.seller = info['seller']
    self.start_price_usd = info['startPriceUSD']
    self.start_time = info['startTime']
    self.duration_days = info['durationDays']
    self.fee_bps = info['feeBps']
    self.settled = info['settled']
    self.sale_price_eth = info['salePriceETH'] if info['settled']
    save!
  rescue => e
    Rails.logger.error("Failed to update auction info: #{e.message}")
    false
  end
end
