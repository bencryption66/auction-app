class AuthController < ApplicationController
  def verify_signature
    address = params[:address]
    signature = params[:signature]
    message = params[:message]
    
    # Verify the signature matches the address
    if verify_ethereum_signature(address, signature, message)
      user = User.find_or_create_by_address(address)
      user.update(last_sign_in_at: Time.current)
      
      # Store user ID in session
      session[:user_id] = user.id
      
      render json: { 
        success: true, 
        user: {
          id: user.id,
          ethereum_address: user.ethereum_address,
          display_address: user.display_address,
          display_name: user.display_name
        }
      }
    else
      render json: { success: false, error: 'Invalid signature' }, status: :unauthorized
    end
  end
  
  def sign_out
    session[:user_id] = nil
    render json: { success: true }
  end
  
  def current_user_info
    if current_user
      render json: {
        authenticated: true,
        user: {
          id: current_user.id,
          ethereum_address: current_user.ethereum_address,
          display_address: current_user.display_address,
          display_name: current_user.display_name
        }
      }
    else
      render json: { authenticated: false }
    end
  end
  
  private
  
  def verify_ethereum_signature(address, signature, message)
    begin
      # This is a simplified check - you'd want to use a proper Ethereum signature verification library
      VerifySignedMessage.call(
        message: message,
        signature: signature,
        address: address
      )
    rescue => e
      Rails.logger.error "Signature verification error: #{e.message}"
      false
    end
  end
end
