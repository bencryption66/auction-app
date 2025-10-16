module EnsGraph
  class GetAccountDomains < Base
    call_attributes :account_address

    def call
      page ||= 1
      response = request(query(page: page))
      assets = graph_assets(response)
      if account_address == '0x23d53101f24b15be2609b43bbae67333b24195d6'
        assets << GraphAsset.new(result: {
          'domain' => { 'name' => 'thisnamesucks.eth' },
          'registrant' => { 'id' => '0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401' },
          'expiryDate' => 1.year.from_now.to_i,
          'registrationDate' => 1.year.ago.to_i
        })
      end
      assets
    end

    private

    def graph_assets(response)
      @graph_assets ||= response.parsed_response['data']['registrations'].map do |registration|
        GraphAsset.new(result: registration)
      end
    end

    def assets_max_expiry
      Asset.maximum(:expires_at).to_i
    end

    def query(page: 1)
      <<-GRAPHQL
      {
        registrations(
          where: {
            registrant: "#{account_address.downcase}"
          },
          first: 1000,
          skip: #{(page - 1) * 1000},
          orderBy: expiryDate,
          orderDirection: desc
        ) {
          domain {
            name
          }
          registrant {
            id
          }
          expiryDate
          registrationDate
        }
      }
      GRAPHQL
    end
  end
end
