require "rails_helper"

RSpec.describe AuctionsController, type: :routing do
  describe "routing" do
    it "routes to #index" do
      expect(get: "/auctions").to route_to("auctions#index")
    end

    it "routes to #new" do
      expect(get: "/auctions/new").to route_to("auctions#new")
    end

    it "routes to #show" do
      expect(get: "/auctions/1").to route_to("auctions#show", id: "1")
    end

    it "routes to #edit" do
      expect(get: "/auctions/1/edit").to route_to("auctions#edit", id: "1")
    end


    it "routes to #create" do
      expect(post: "/auctions").to route_to("auctions#create")
    end

    it "routes to #update via PUT" do
      expect(put: "/auctions/1").to route_to("auctions#update", id: "1")
    end

    it "routes to #update via PATCH" do
      expect(patch: "/auctions/1").to route_to("auctions#update", id: "1")
    end

    it "routes to #destroy" do
      expect(delete: "/auctions/1").to route_to("auctions#destroy", id: "1")
    end
  end
end
