module EnsGraph
  class GetAccountDomains < Base
    call_attributes :account_address

    def call
      page ||= 1
      response = request(query(page: page))
      puts response.parsed_response
      response.parsed_response['data']['registrations']
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
