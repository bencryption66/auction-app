import { Controller } from "@hotwired/stimulus";
import onboardOptions from '../onboard.js';
import Onboard from '@web3-onboard/core';

export default class extends Controller {
  static targets = ["connectButton", "nav"];

  async connect() {
    console.log("WalletConnectController connected");
    this.isAuthenticating = false;
    this.authenticatedAddress = null;
    await this.initializeOnboard();
    await this.checkExistingAuth();
  }

  async initializeOnboard() {
    console.log("Initializing Onboard.js...");
    this.onboard = Onboard(onboardOptions);
    
    const state = this.onboard.state.select();
    const { unsubscribe } = state.subscribe(this.handleStateUpdate.bind(this));
  }

  async handleStateUpdate(state) {
    console.log("Onboard state updated:", state);
    
    if (state.wallets.length > 0) {
      const wallet = state.wallets[0];
      const address = wallet.accounts[0].address;
      
      // Check if user is already authenticated for this address
      const isAlreadyAuthenticated = await this.checkIfAuthenticated(address);
      
      if (isAlreadyAuthenticated) {
        console.log("User already authenticated, skipping sign message");
        this.authenticatedAddress = address.toLowerCase();
        this.showWalletSpecificElements(address);
        // Update UI without re-authenticating
        const response = await fetch('/auth/current_user');
        const result = await response.json();
        if (result.authenticated) {
          this.updateUIWithUser(result.user);
        }
      } else if (!this.isAuthenticating && 
                 this.authenticatedAddress !== address.toLowerCase()) {
        console.log("New wallet detected, authenticating...");
        await this.authenticateWithBackend(address, wallet.provider);
      } else {
        console.log("Already authenticated or authentication in progress");
      }
    } else {
      this.handleDisconnect();
    }
  }

  async checkIfAuthenticated(address) {
    try {
      const response = await fetch('/auth/current_user');
      const result = await response.json();
      
      return result.authenticated && 
             result.user.ethereum_address.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async authenticateWithBackend(address, provider) {
    if (this.isAuthenticating) {
      console.log("Authentication already in progress, skipping...");
      return;
    }

    this.isAuthenticating = true;
    
    try {
      console.log("Starting authentication for:", address);
      
      const message = `Sign this message to authenticate with the auction app.\n\nAddress: ${address}\nTime: ${new Date().toISOString()}`;
      const signature = await this.signMessage(provider, address, message);
      
      const response = await fetch('/auth/verify_signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          address: address,
          signature: signature,
          message: message
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.authenticatedAddress = address.toLowerCase();
        this.updateUIWithUser(result.user);
        this.showWalletSpecificElements(address);
        console.log("Authentication successful for:", address);
      } else {
        console.error('Authentication failed:', result.error);
        this.handleDisconnect();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      this.handleDisconnect();
    } finally {
      this.isAuthenticating = false;
    }
  }

  async signMessage(provider, address, message) {
    console.log("Signing message for address:", address);
    
    try {
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address],
      });
      
      console.log("Signature successful");
      return signature;
      
    } catch (error) {
      console.error("Signing failed:", error);
      throw new Error(`Signing failed: ${error.message}`);
    }
  }

  async checkExistingAuth() {
    try {
      const response = await fetch('/auth/current_user');
      const result = await response.json();
      
      if (result.authenticated) {
        console.log("User already authenticated:", result.user.ethereum_address);
        this.authenticatedAddress = result.user.ethereum_address.toLowerCase();
        
        // Check if the authenticated address matches connected wallet
        const wallets = this.onboard.state.get().wallets;
        if (wallets.length > 0) {
          const connectedAddress = wallets[0].accounts[0].address;
          if (connectedAddress.toLowerCase() === result.user.ethereum_address.toLowerCase()) {
            this.updateUIWithUser(result.user);
            this.showWalletSpecificElements(connectedAddress);
            return;
          } else {
            console.log("Connected wallet doesn't match authenticated user, signing out");
            await this.signOut();
          }
        } else {
          // User is authenticated but no wallet connected - show authenticated state
          this.updateUIWithUser(result.user);
        }
      } else {
        console.log("No existing authentication found");
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
    }
  }

  async connectWallet() {
    console.log("Connect button clicked...");
    const wallets = this.onboard.state.get().wallets;

    if (wallets.length === 0) {
      console.log("No previously connected wallets. Prompting user to connect...");
      const connectedWallets = await this.onboard.connectWallet();
      console.log("Connected wallets:", connectedWallets);
    } else {
      console.log("Wallet already connected.");
    }
  }

  async signOut() {
    try {
      await fetch('/auth/sign_out', {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      });
      
      const wallets = this.onboard.state.get().wallets;
      if (wallets.length > 0) {
        await this.onboard.disconnectWallet({ label: wallets[0].label });
      }
      
      this.handleDisconnect();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  updateUIWithUser(user) {
    this.connectButtonTarget.innerHTML = user.display_name;
    this.connectButtonTarget.classList.remove("btn-primary");
    this.connectButtonTarget.classList.add("btn-secondary");
    this.connectButtonTarget.onclick = () => this.signOut();
    this.addUserNavLinks(user);
  }

  handleDisconnect() {
    this.connectButtonTarget.innerHTML = "Connect Wallet";
    this.connectButtonTarget.classList.remove("btn-secondary");
    this.connectButtonTarget.classList.add("btn-primary");
    this.connectButtonTarget.onclick = () => this.connectWallet();
    
    this.isAuthenticating = false;
    this.authenticatedAddress = null;
    
    this.removeUserNavLinks();
    this.hideAllWalletSpecificElements();
  }

  addUserNavLinks(user) {
    const nav = this.navTarget;
    this.removeUserNavLinks();
    
    const myNamesLink = document.createElement("a");
    myNamesLink.id = "wallet-assets-link";
    myNamesLink.href = `/accounts/${user.ethereum_address}/assets`;
    myNamesLink.className = "nav-link";
    myNamesLink.textContent = "My Names";
    nav.appendChild(myNamesLink);
  }

  removeUserNavLinks() {
    const existingLink = document.querySelector("#wallet-assets-link");
    if (existingLink) {
      existingLink.remove();
    }
  }

  showWalletSpecificElements(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    const walletElements = document.querySelectorAll('[data-show-to-wallet]');
    
    walletElements.forEach(element => {
      const targetAddress = element.dataset.showToWallet.toLowerCase();
      
      if (targetAddress === normalizedAddress || targetAddress === 'any') {
        element.style.display = element.dataset.originalDisplay || 'block';
      } else if (targetAddress !== 'none') {
        element.style.display = 'none';
      }
    });
  }

  hideAllWalletSpecificElements() {
    const walletElements = document.querySelectorAll('[data-show-to-wallet]');
    
    walletElements.forEach(element => {
      if (element.dataset.showToWallet !== 'none') {
        element.style.display = 'none';
      } else {
        element.style.display = element.dataset.originalDisplay || 'block';
      }
    });
  }

  getCurrentWalletAddress() {
    const wallets = this.onboard?.state.get().wallets || [];
    return wallets.length > 0 ? wallets[0].accounts[0].address : null;
  }
}