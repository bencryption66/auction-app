import { Controller } from "@hotwired/stimulus";
import onboardOptions from '../onboard.js';
import Onboard from '@web3-onboard/core';

export default class extends Controller {
  static targets = ["connectButton", "nav"];

  connectButtonTargetConnected() {
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
      this.showWalletSpecificElements(wallet.accounts[0].address);
    } else {
      this.connectButtonTarget.innerHTML = "Connect Wallet";
      this.connectButtonTarget.classList.remove("btn-secondary");
      this.connectButtonTarget.classList.add("btn-primary");
      this.hideAllWalletSpecificElements();
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
        this.showWalletSpecificElements(connectedWallets[0].accounts[0].address);
      } else {
        console.log("No wallet connected.");
      }
    } else {
      console.log("Using previously connected wallet.");
      this.updateUIWithWalletInfo(wallets[0]);
      this.showWalletSpecificElements(wallets[0].accounts[0].address);
    }
  }

  updateUIWithWalletInfo(wallet) {
    const primaryAddress = wallet.accounts[0].address;
    this.connectButtonTarget.innerHTML = primaryAddress;
    this.connectButtonTarget.classList.remove("btn-primary");
    this.connectButtonTarget.classList.add("btn-secondary");

    this.addWalletNavLink(primaryAddress);
  }

  addWalletNavLink(address) {
    const nav = this.navTarget;
    const existingLink = nav.querySelector("#wallet-assets-link");

    if (!existingLink) {
      const link = document.createElement("a");
      link.id = "wallet-assets-link";
      link.href = `/accounts/${address}/assets`;
      link.className = "nav-link";
      link.textContent = "My Names";
      nav.appendChild(link);
    }
  }

  // New methods for showing/hiding wallet-specific elements
  showWalletSpecificElements(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Find all elements with data-show-to-wallet attribute
    const walletElements = document.querySelectorAll('[data-show-to-wallet]');
    
    walletElements.forEach(element => {
      const targetAddress = element.dataset.showToWallet.toLowerCase();
      
      if (targetAddress === normalizedAddress) {
        // Show element for matching wallet
        element.style.display = element.dataset.originalDisplay || 'block';
        console.log(`Showing element for wallet ${walletAddress}:`, element);
      } else {
        // Hide element for non-matching wallet
        if (!element.dataset.originalDisplay) {
          element.dataset.originalDisplay = getComputedStyle(element).display;
        }
        element.style.display = 'none';
      }
    });

    // Also handle elements that should be shown to ANY connected wallet
    const anyWalletElements = document.querySelectorAll('[data-show-to-wallet="any"]');
    anyWalletElements.forEach(element => {
      element.style.display = element.dataset.originalDisplay || 'block';
      console.log('Showing element for any connected wallet:', element);
    });
  }

  hideAllWalletSpecificElements() {
    // Hide all wallet-specific elements when no wallet is connected
    const walletElements = document.querySelectorAll('[data-show-to-wallet]');
    
    walletElements.forEach(element => {
      // Store original display value if not already stored
      if (!element.dataset.originalDisplay) {
        element.dataset.originalDisplay = getComputedStyle(element).display;
      }
      element.style.display = 'none';
      console.log('Hiding wallet-specific element:', element);
    });
  }

  // Public method to get current wallet address (useful for other controllers)
  getCurrentWalletAddress() {
    const wallets = this.onboard?.state.get().wallets || [];
    return wallets.length > 0 ? wallets[0].accounts[0].address : null;
  }
}
