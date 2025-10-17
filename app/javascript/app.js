console.log("application.js is loaded!");
// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@popperjs/core"
import "bootstrap"

import { Application } from "@hotwired/stimulus";
import CategoryFilterController from "./controllers/category_filter_controller"; // Import the bots controller
import WalletConnectController from "./controllers/wallet_connect_controller"; // Import the wallet connect controller
import AuctionController from "./controllers/auction_controller"; // Import the auction controller
import AuctionClaimController from "./controllers/auction_claim_controller"; // Import the auction claim controller
import AuctionBuyController from "./controllers/auction_buy_controller"; // Import the auction buy controller
import AuctionPriceController from "./controllers/auction_price_controller"; // Import the auction price controller
import EnsRegistrationController from "./controllers/ens_registration_controller"; // Import the ENS registration controller

console.log("XXX");
const application = Application.start();

// Configure Stimulus development experience
application.debug = true;
application.register("category-filter", CategoryFilterController); // Register the bots controller
application.register("wallet-connect", WalletConnectController); // Register the wallet connect controller
application.register("auction", AuctionController); // Register the auction controller
application.register("auction-claim", AuctionClaimController); // Register the auction claim controller
application.register("auction-buy", AuctionBuyController); // Register the auction buy controller
application.register("auction-price", AuctionPriceController); // Register the auction price controller
application.register("ens-registration", EnsRegistrationController); // Register the ENS registration controller
console.log("YYY");
console.log("ZZZ");
window.Stimulus = application;