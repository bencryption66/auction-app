class Categorizer
  attr_reader :asset

  CATEGORIES = {
    '999 Club' => { slug: '999-club', checker: :check_999 },
    '10K Club' => { slug: '10k-club', checker: :check_10k }
  }.freeze

  def initialize(asset)
    @asset = asset
  end

  def call
    CATEGORIES.each do |name, details|
      if send(details[:checker])
        category = Category.find_or_create_by(name: name, slug: details[:slug])
        asset.categories << category unless asset.categories.include?(category)
      end
    end
    asset.save if asset.changed?
  end

  private

  def check_999
    # Any number between 000 and 999, always 3 digits
    !!(asset.name_without_suffix =~ /\A\d{3}\z/)
  end

  def check_10k
    # Any number between 0000 and 9999, always 4 digits
    !!(asset.name_without_suffix =~ /\A\d{4}\z/)
  end
end
