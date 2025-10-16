class GetTokenId
  include Callable

  call_attributes :contract_address, :name

  def call
    token_id
  end

  private

  def name_without_suffix
    name.end_with?('.eth') ? name[0..-5] : name
  end

  def wrapped?
    contract_address.downcase == Ethereum::Chain::ENS_WRAPPER_ADDRESS.downcase
  end

  def token_id
    label_hash.to_i(16).to_s
  end

  def label_hash
    return namehash(name) if wrapped?

    Digest::Keccak.hexdigest(name_without_suffix, 256)
  end

  def namehash(name)
    return Digest::Keccak.hexdigest(name_without_suffix, 256) unless wrapped?
    return '0x' + ('00' * 32) if name.empty?

    label, remainder = name.split('.', 2)
    remainder ||= ''

    namehash_hex = namehash(remainder)
    namehash_bytes = [namehash_hex[2..-1]].pack('H*')
    label_hash = Digest::Keccak.digest(label, 256)

    '0x' + Digest::Keccak.hexdigest(namehash_bytes + label_hash, 256)
  end
end
