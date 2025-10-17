module EnsGraph
  class GetPremiumDomains < Base
    RESULTS_PER_PAGE = 1000

    def call(page: 1)
      response = request(query(page: page))
      puts response.parsed_response
      response.parsed_response['data']['registrations']
    end

    def expires_before
      (Time.current - 90.days).utc.to_i
    end

    def assets_max_expiry
      Asset.maximum(:expires_at).to_i
    end

    def expires_after
      # return assets_max_expiry if assets_max_expiry.positive?

      (Time.current - 90.days - 21.days).utc.to_i
    end

    def query(page: 1)
      <<-GRAPHQL
      {
        registrations(
          where: {
            expiryDate_gte: #{expires_after},
            expiryDate_lt: #{expires_before}
          }
          orderBy: expiryDate
          orderDirection: asc
          first: #{RESULTS_PER_PAGE}
          skip: #{(page - 1) * RESULTS_PER_PAGE}
        ) {
          id
          expiryDate
          registrationDate
          domain {
            name,
            registrant { id }
          }
          registrant { id }
        }
      }
      GRAPHQL
    end
  end
end
