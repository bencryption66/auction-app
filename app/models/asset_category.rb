class AssetCategory < ApplicationRecord
  belongs_to :asset
  belongs_to :category
end
