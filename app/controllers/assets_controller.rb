class AssetsController < ApplicationController
  before_action :set_account_address, only: [:index]

  def index
    if @account_address.present?
      @results = account_assets(@account_address)
      if params[:search].present?
        @results.select! { |result| result["domain"]["name"].downcase.include?(params[:search].downcase) }
      end
      render 'assets/account_index' and return
    end

    @selected_categories = params[:categories].present? ? params[:categories].split(',').map(&:to_i) : []
    @search_query = params[:search]

    @assets = Asset.in_premium_period
                   .includes(:collection, :categories)
                   .order(expires_at: :asc)
                   .then { |assets| @selected_categories.any? ? assets.joins(:categories).where(categories: { id: @selected_categories }) : assets }
                   .then { |assets| @search_query.present? ? assets.where('assets.name LIKE ?', "%#{@search_query.downcase}%") : assets }
                   .page(params[:page])
                   .per(100)

    category_counts
  end

  def category_counts
    @category_counts = Category.joins(:assets)
                               .merge(Asset.in_premium_period)
                               .group('categories.id')
                               .order('categories.name ASC')
                               .count
  end

  private

  def set_account_address
    @account_address = params[:account_id]
  end

  def account_assets(account_address)
    Rails.logger.info "Fetching assets for account: #{account_address}"
    EnsGraph::GetAccountDomains.call(account_address: account_address)
  end
end
