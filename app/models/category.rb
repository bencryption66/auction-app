class Category < ApplicationRecord
  has_many :asset_categories
  has_many :assets, through: :asset_categories
end
