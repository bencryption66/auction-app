module Ens
  class Avatar
    include HTTParty
    include Callable

    base_uri 'https://metadata.ens.domains'

    call_attributes :nft_address, :token_id

    def call
      avatar
    end

    private

    def avatar
      metadata = Ens::Metadata.call(nft_address:, token_id:)
      return nil unless metadata && metadata['name']

      begin
        response = self.class.get("/mainnet/avatar/#{metadata['name']}")
        puts response.inspect
        return nil unless response.success?

        # Return the URL if it's a redirect, otherwise return the ENS metadata URL
        if response.code == 200
          "https://metadata.ens.domains/mainnet/avatar/#{metadata['name']}"
        else
          nil
        end
      end
    rescue
      nil
    end
  end
end
