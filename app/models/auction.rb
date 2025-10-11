class Auction < ApplicationRecord
  belongs_to :asset

  validates :creator, presence: true
end
