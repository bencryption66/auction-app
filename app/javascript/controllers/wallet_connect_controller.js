import { Controller } from "@hotwired/stimulus";
import onboardOptions from '../onboard.js';
import Onboard from '@web3-onboard/core';

export default class extends Controller {
  static targets = ["connectButton", "nav"]; // Define a target for the connect button

  connectButtonTargetConnected() {
    // Automatically check for previously connected wallets on page load
    console.log("WalletConnectController connected");
    this.initializeOnboard();
    const state = this.onboard.state.select();
    const { unsubscribe } = state.subscribe((update) => console.log('state update: ', update));

  }

  async initializeOnboard() {
    console.log("Initializing Onboard.js...");
    const MAINNET_RPC_URL = 'https://mainnet.infura.io/v3/14f4ffab5b0f412996d742f8ff791207';

    this.onboard = Onboard(onboardOptions);
    console.log("Onboard.js initialized:", this.onboard);

    const state = this.onboard.state.select()
    const { unsubscribe } = state.subscribe(this.handleStateUpdate.bind(this));

  }

  async handleStateUpdate(state) {
    console.log("Onboard state updated:", state);
    if (state.wallets.length > 0) {
      const wallet = state.wallets[0];
      this.updateUIWithWalletInfo(wallet);
    } else {
      this.connectButtonTarget.innerHTML = "Connect Wallet"; // Reset button text if no wallet is connected
      this.connectButtonTarget.classList.remove("btn-secondary");
      this.connectButtonTarget.classList.add("btn-primary");
    }
  }

  async checkForPreviouslyConnectedWallet() {
    const previouslyConnectedWallets = this.onboard.state.get().wallets;
    console.log("Previously connected wallets:", previouslyConnectedWallets);

    return previouslyConnectedWallets;
  }

  async connectWallet() {
    console.log("Connect button clicked...");
    const wallets = await this.checkForPreviouslyConnectedWallet();

    if (wallets.length === 0) {
      console.log("No previously connected wallets. Prompting user to connect...");
      const connectedWallets = await this.onboard.connectWallet();
      console.log("Connected wallets:", connectedWallets);

      if (connectedWallets.length > 0) {
        this.updateUIWithWalletInfo(connectedWallets[0]);
      } else {
        console.log("No wallet connected.");
      }
    } else {
      console.log("Using previously connected wallet.");
      this.updateUIWithWalletInfo(wallets[0]);
    }
  }

  updateUIWithWalletInfo(wallet) {
    const primaryAddress = wallet.accounts[0].address;
    this.connectButtonTarget.innerHTML = primaryAddress; // Replace the button text with the wallet address
    this.connectButtonTarget.classList.remove("btn-primary"); // Optionally remove button styling
    this.connectButtonTarget.classList.add("btn-secondary"); // Optionally add new styling

    this.addWalletNavLink(primaryAddress);
  }

  addWalletNavLink(address) {
    const nav = this.navTarget; // Get the navigation bar target
    const existingLink = nav.querySelector("#wallet-assets-link");

    // Avoid adding the link multiple times
    if (!existingLink) {
      const link = document.createElement("a");
      link.id = "wallet-assets-link";
      link.href = `/accounts/${address}/assets`;
      link.className = "nav-link";
      link.textContent = "My Names";
      nav.appendChild(link);
    }
  }
}
