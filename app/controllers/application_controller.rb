class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  before_action :set_current_user

  protected

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

  def set_current_user
    @current_user = current_user
  end

  def require_authentication
    unless current_user
      render json: { error: 'Authentication required' }, status: :unauthorized
    end
  end

  helper_method :current_user
end
