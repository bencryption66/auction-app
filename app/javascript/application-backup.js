console.log("application.js is loaded!");
// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"
import "popper"
import "bootstrap"

import { Application } from "@hotwired/stimulus";
import BotsController from "./controllers/bots"; // Import the bots controller
console.log("XXX");
const application = Application.start();

// Configure Stimulus development experience
application.debug = true;
application.register("bots", BotsController); // Register the bots controller

