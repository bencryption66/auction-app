class AuctionsController < ApplicationController
  include ActionView::Helpers::NumberHelper

  before_action :set_auction, only: [:show, :current_price, :blockchain_price]

  def create
    @auction = Auction.new(auction_params)

    if @auction.save
      render json: { status: 'success', auction: @auction }
    else
      render json: { status: 'error', errors: @auction.errors }, status: :unprocessable_entity
    end
  end

  def check
    @auction = Auction.not_expired.find_by(
      nft_address: params[:nft_address],
      token_id: params[:token_id]
    )

    if @auction
      render json: { exists: true, auction: @auction }
    else
      render json: { exists: false, auction: nil }
    end
  end

  def current_price
    if @auction.settled?
      price_text = "#{number_with_precision(@auction.sale_price_eth.to_f / 1e18, precision: 4)} ETH"
      status = "sold"
    elsif @auction.expired?
      price_text = "Expired"
      status = "expired"
    else
      current_price = @auction.current_price_usd
      price_text = current_price ? "$#{number_with_precision(current_price, precision: 2)}" : "Loading..."
      status = "active"
    end

    render json: {
      price: price_text,
      status: status,
      expired: @auction.expired?,
      settled: @auction.settled?
    }
  end

  def blockchain_price
    result = @auction.current_price_view
    render json: result
  end

  def index
    @auctions = Auction.includes(:asset).active.order(created_at: :desc)
  end

  def show
    @auction.update_auction_info! unless @auction.settled?
  end

  private

  def set_auction
    @auction = Auction.find(params[:id])
  end

  def auction_asset
    collection = Collection.find_by(contract_address: params[:auction][:nft_address])
    return nil unless collection

    Asset.find_or_create_by(name: params[:auction][:domain_name], collection: collection)
  end

  def auction_params
    params.require(:auction).permit(
      :nft_address, :token_id, :domain_name, :seller,
      :start_price_usd, :start_time, :duration_days, :fee_bps,
      :settled, :buyer, :sale_price_eth, :token_standard, :contract_address
    ).merge(asset: auction_asset)
  end
end
