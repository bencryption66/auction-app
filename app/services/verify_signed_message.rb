class VerifySignedMessage
  include Callable
  call_attributes :message, :signature, :address

  def call
    Eth::Signature.verify(message, signature, address)
  end
end
