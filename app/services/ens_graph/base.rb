module EnsGraph
  class Base
    include Callable

    API_KEYS = [
      '5d43e7bb00f45505b8db8dfc4a6f2c05',
      '028ef887072cee17ba94fa13b7f168f5'
      # '7c7a002089ddb2e8dce8f46a841e56a7',
      # '4db0bdd6638dcd4b045579bb6c9a4319'
    ]

    def graph_endpoint
      api_key = API_KEYS.sample
      "https://gateway-arbitrum.network.thegraph.com/api/#{api_key}/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH"
    end

    def request(query)
      HTTParty.post(
        graph_endpoint,
        body: {
          query: query
        }.to_json
      )
    end
  end
end
