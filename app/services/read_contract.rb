class ReadContract
  include Callable

  call_attributes :rpc_url, :contract_address, :abi, :args, :function_name

  def call
    query
  end

  private

  def client
    @client ||= Eth::Client.create rpc_url
  end

  def contract
    @contract ||= Eth::Contract.from_abi(abi: abi.to_json, address: contract_address, name: 'ContractFunction')
  end

  def query
    puts client.inspect
    puts contract.inspect
    puts args.inspect
    client.call(contract, function_name, *args)
  end
end
