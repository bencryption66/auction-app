class User < ApplicationRecord
  validates :ethereum_address, presence: true, uniqueness: { case_sensitive: false }

  before_save :normalize_ethereum_address

  has_many :auctions, foreign_key: 'seller', primary_key: 'ethereum_address'

  def self.find_or_create_by_address(address)
    normalized_address = address.downcase
    find_or_create_by(ethereum_address: normalized_address)
  end

  def display_address
    return ethereum_address unless ethereum_address
    "#{ethereum_address[0..5]}...#{ethereum_address[-4..-1]}"
  end

  def display_name
    name.present? ? name : display_address
  end

  private

  def normalize_ethereum_address
    self.ethereum_address = ethereum_address.downcase if ethereum_address
  end
end
