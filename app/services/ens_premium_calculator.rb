# frozen_string_literal: true

# ENS premium calculator (matches ExponentialPremiumPriceOracle)
# - start_premium_atto_usd: Integer (attoUSD, i.e., USD * 1e18)
# - total_days: Integer (how many whole days for halving down to endValue)
#
# Usage:
#   calc = EnsPremiumCalculator.new(start_premium_atto_usd: 1_000 * 10**18, total_days: 21)
#   premium_atto_usd = calc.current_premium(Time.at(1_700_000_000))  # => Integer (attoUSD)
#   premium_wei = calc.atto_usd_to_wei(premium_atto_usd, eth_usd_price_8dec: 3500_00000000)
#
class EnsPremiumCalculator
  GRACE_PERIOD = 90 * 24 * 60 * 60 # 90 days (in seconds)
  PREMIUM_PERIOD = 21 * 24 * 60 * 60 # 90 days (in seconds)
  PRECISION    = 10**18
  DAY_SECONDS  = 86_400

  # 0.5^(1/65536 * k) * 1e18 for k = 1..16 (copied from the solidity contract)
  BITS = [
    999_989_423_469_314_432,
    999_978_847_050_491_904,
    999_957_694_548_431_104,
    999_915_390_886_613_504,
    999_830_788_931_929_088,
    999_661_606_496_243_712,
    999_323_327_502_650_752,
    998_647_112_890_970_240,
    997_296_056_085_470_080,
    994_599_423_483_633_152,
    989_228_013_193_975_424,
    978_572_062_087_700_096,
    957_603_280_698_573_696,
    917_004_043_204_671_232,
    840_896_415_253_714_560,
    707_106_781_186_547_584
  ].freeze

  def initialize(start_premium: 100_000_000, total_days: 21)
    raise ArgumentError, "start_premium must be Integer" unless start_premium.is_a?(Integer)
    raise ArgumentError, "total_days must be >= 0" unless total_days.is_a?(Integer) && total_days >= 0

    @duration    = total_days * 24 * 60 * 60 # convert to seconds
    @start_premium = start_premium * 1_000_000_000
    @end_value     = 0
  end

  def current_premium_from_time_remaining(time_remaining)
    proportional_time_remaining = ((PREMIUM_PERIOD / @duration.to_f) * time_remaining).ceil
    puts "proportional_time_remaining: #{proportional_time_remaining}"
    expiry_time = (Time.now.to_i + proportional_time_remaining) - (PREMIUM_PERIOD + GRACE_PERIOD)
    puts "expiry_time: #{expiry_time}"
    current_premium(expiry_time)
  end

  # expiry_time: Time or Integer (unix seconds) of the ENS name's expiry (NOT including grace period)
  # returns: Integer premium in attoUSD
  def current_premium(expiry_time)
    exp = expiry_time.is_a?(Time) ? expiry_time.to_i : Integer(expiry_time)
    exp += GRACE_PERIOD
    now = Time.now.to_i
    return 0 if exp > now # still in active/grace; no premium yet

    elapsed = now - exp
    premium = decayed_premium(@start_premium, elapsed)
    result = premium >= @end_value ? (premium - @end_value) : 0
    result / 1_000_000_000.0
  end

  # Optional: convert attoUSD -> wei using a Chainlink-like ETH/USD price with 8 decimals (e.g., $3500 = 3500_00000000)
  def atto_usd_to_wei(amount_atto_usd, eth_usd_price_8dec:)
    raise ArgumentError, "amount_atto_usd must be Integer" unless amount_atto_usd.is_a?(Integer)
    raise ArgumentError, "eth_usd_price_8dec must be Integer > 0" unless eth_usd_price_8dec.is_a?(Integer) && eth_usd_price_8dec.positive?

    (amount_atto_usd * 10**8) / eth_usd_price_8dec
  end

  def time_to_reach_price(target_price, expiry_time)
    raise ArgumentError, "target_price must be Integer" unless target_price.is_a?(Integer)
    raise ArgumentError, "target_price must be >= 0" unless target_price >= 0

    exp = expiry_time.is_a?(Time) ? expiry_time.to_i : Integer(expiry_time)
    exp += GRACE_PERIOD
    now = exp + PREMIUM_PERIOD

    # If the target price is greater than the starting premium, it's never reached
    return nil if target_price > @start_premium

    # Binary search to find the time when the premium decays to the target price
    low = exp
    high = now
    result_time = nil

    while low <= high
      mid = (low + high) / 2
      elapsed = now - mid
      current_price = decayed_premium(@start_premium, elapsed)

      if current_price >= target_price
        result_time = mid
        high = mid - 1
      else
        low = mid + 1
      end
    end

    result_time ? Time.at(result_time) : nil
  end

  private

  def decayed_premium(start_premium, elapsed_seconds)
    days_past = (elapsed_seconds * PRECISION) / DAY_SECONDS
    int_days  = days_past / PRECISION
    premium   = start_premium >> int_days

    part_day  = days_past - int_days * PRECISION
    fraction  = (part_day * (1 << 16)) / PRECISION # 16-bit fractional day

    add_fractional_premium(fraction, premium)
  end

  def add_fractional_premium(fraction, premium)
    p = premium
    16.times do |i|
      if (fraction & (1 << i)) != 0
        p = (p * BITS[i]) / PRECISION
      end
    end
    p
  end
end
