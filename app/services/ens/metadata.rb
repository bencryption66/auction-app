module Ens
  class Metadata
    include HTTParty
    include Callable
    base_uri 'https://metadata.ens.domains'

    call_attributes :nft_address, :token_id

    def call
      metadata
    end

    private

    def metadata
      @metadata ||= begin
        response = self.class.get("/mainnet/#{nft_address}/#{token_id}")
        puts response.inspect
        return nil unless response.success?

        JSON.parse(response.body)
      end
    rescue JSON::ParserError
      nil
    end
  end
end
