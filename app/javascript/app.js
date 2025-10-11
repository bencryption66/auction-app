console.log("application.js is loaded!");
// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@popperjs/core"
import "bootstrap"

import { Application } from "@hotwired/stimulus";
import CategoryFilterController from "./controllers/category_filter_controller"; // Import the bots controller
import WalletConnectController from "./controllers/wallet_connect_controller"; // Import the wallet connect controller
console.log("XXX");
const application = Application.start();

// Configure Stimulus development experience
application.debug = true;
application.register("category-filter", CategoryFilterController); // Register the bots controller
application.register("wallet-connect", WalletConnectController); // Register the wallet connect controller
console.log("YYY");
console.log("ZZZ");
window.Stimulus = application;