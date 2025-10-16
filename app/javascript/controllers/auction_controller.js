import { Controller } from "@hotwired/stimulus";
import { Modal } from "bootstrap";

export default class extends Controller {
  static targets = ["sellButton", "modal", "form", "domainNameDisplay", "startPriceInput", "durationInput", "createButton"];

  connect() {
    this.contractAddress = "0x918B512FE14568A63Fa1bD57b7DF5c6ea6A1Df5B";
    // Store current auction data
    this.currentAuction = {
      nftAddress: null,
      tokenId: null,
      domainName: null,
      contractAddress: null
    };
  }

  openModal(event) {
    event.preventDefault();
    
    // Get data from the clicked button
    const button = event.currentTarget;
    this.currentAuction.nftAddress = button.dataset.nftAddress;
    this.currentAuction.tokenId = button.dataset.tokenId;
    this.currentAuction.domainName = button.dataset.domainName;
    this.currentAuction.contractAddress = button.dataset.contractAddress || this.contractAddress;
    
    // First check if an auction already exists
    this.checkExistingAuction(event);
  }

  async checkExistingAuction(event) {
    try {
      // Get wallet connection from the wallet-connect controller
      const walletController = this.application.getControllerForElementAndIdentifier(
        document.querySelector('[data-controller*="wallet-connect"]'), 
        'wallet-connect'
      );
      
      if (!walletController || !walletController.onboard) {
        alert("Please connect your wallet first");
        return;
      }

      const wallets = walletController.onboard.state.get().wallets;
      if (wallets.length === 0) {
        alert("No wallet connected");
        return;
      }

      const wallet = wallets[0];
      const provider = wallet.provider;

      // Check if auction exists on the blockchain
      const existingAuction = await this.getAuctionFromContract(provider);
      
      // Check if the auction has a seller (meaning it exists)
      if (existingAuction.seller && existingAuction.seller !== "0x0000000000000000000000000000000000000000" && !existingAuction.settled) {
        // Auction exists on blockchain, check if it exists in our database
        const dbAuction = await this.checkAuctionInDatabase();
        
        if (dbAuction) {
          // Auction exists in database, redirect to it
          window.location.href = `/auctions/${dbAuction.id}`;
          return;
        } else {
          // Auction exists on blockchain but not in database, save it
          await this.saveExistingAuctionToDatabase(existingAuction);
          return;
        }
      }
      
      // No existing auction, show the modal to create a new one
      this.showCreateAuctionModal();
      
    } catch (error) {
      console.error("Error checking existing auction:", error);
      // If there's an error checking, still allow them to create auction
      this.showCreateAuctionModal();
    }
  }

  async checkAuctionInDatabase() {
    try {
      const response = await fetch(`/auctions/check?nft_address=${this.currentAuction.nftAddress}&token_id=${this.currentAuction.tokenId}`, {
        headers: {
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.auction;
      }
      return null;
    } catch (error) {
      console.error("Error checking auction in database:", error);
      return null;
    }
  }

  async saveExistingAuctionToDatabase(auctionDetails) {
    try {
      // Convert BigInt values to strings for JSON serialization
      const auctionData = {
        nft_address: this.currentAuction.nftAddress,
        token_id: auctionDetails.tokenId.toString(),
        domain_name: this.currentAuction.domainName,
        seller: auctionDetails.seller,
        start_price_usd: auctionDetails.startPriceUSD.toString(),
        start_time: auctionDetails.startTime.toString(),
        duration_days: auctionDetails.durationDays.toString(),
        fee_bps: auctionDetails.feeBps.toString(),
        settled: auctionDetails.settled,
        buyer: auctionDetails.buyer,
        sale_price_eth: auctionDetails.salePriceETH.toString(),
        token_standard: auctionDetails.tokenStandard.toString(),
        contract_address: this.currentAuction.contractAddress
      };
      
      console.log("Saving existing auction to database:", auctionData);
      
      // Send to Rails backend
      const response = await fetch('/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          auction: auctionData
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to the saved auction
        window.location.href = `/auctions/${result.auction.id}`;
      } else {
        throw new Error('Failed to save existing auction to database');
      }
    } catch (error) {
      console.error("Error saving existing auction:", error);
      alert("Found existing auction but couldn't save to database. Please try again.");
    }
  }

  showCreateAuctionModal() {
    // Populate the modal
    this.domainNameDisplayTarget.value = this.currentAuction.domainName;
    
    // Reset form
    this.startPriceInputTarget.value = '';
    this.durationInputTarget.value = '';
    this.createButtonTarget.disabled = false;
    this.createButtonTarget.textContent = 'Create Auction';
    
    // Show modal
    const modal = new Modal(this.modalTarget);
    modal.show();
  }

  async createAuction(event) {
    event.preventDefault();
    
    // Validate form
    const startPrice = parseFloat(this.startPriceInputTarget.value);
    const duration = parseInt(this.durationInputTarget.value);
    
    if (!startPrice || startPrice <= 0) {
      alert("Please enter a valid starting price");
      return;
    }
    
    if (!duration || duration <= 0) {
      alert("Please select a duration");
      return;
    }
    
    try {
      // Get wallet connection from the wallet-connect controller
      const walletController = this.application.getControllerForElementAndIdentifier(
        document.querySelector('[data-controller*="wallet-connect"]'), 
        'wallet-connect'
      );
      
      if (!walletController || !walletController.onboard) {
        alert("Please connect your wallet first");
        return;
      }

      const wallets = walletController.onboard.state.get().wallets;
      if (wallets.length === 0) {
        alert("No wallet connected");
        return;
      }

      const wallet = wallets[0];
      const provider = wallet.provider;
      const userAddress = wallet.accounts[0].address;

      // Convert price to uint128 format (multiply by 10^18 for precision)
      const startPriceUSD = Math.floor(startPrice * 1e18);

      this.updateButtonState("Checking approval...", true);

      // Step 1: Check if contract is approved for all tokens
      const isApproved = await this.checkApprovalForAll(provider, userAddress);
      
      if (!isApproved) {
        this.updateButtonState("Approving contract...", true);
        await this.approveForAll(provider);
      }

      // Step 2: Create auction
      this.updateButtonState("Creating auction...", true);
      await this.createAuctionContract(provider, startPriceUSD, duration);

      // Step 3: Get auction details and save to database
      this.updateButtonState("Saving auction...", true);
      const result = await this.saveAuctionToDatabase(provider, startPriceUSD, duration);

      this.updateButtonState("Auction created!", false);
      
      // Close modal and redirect to auction page
      setTimeout(() => {
        const modal = Modal.getInstance(this.modalTarget);
        modal.hide();
        window.location.href = `/auctions/${result.auction.id}`;
      }, 2000);

    } catch (error) {
      console.error("Error creating auction:", error);
      alert(`Error creating auction: ${error.message}`);
      this.updateButtonState("Create Auction", false);
    }
  }

  async checkApprovalForAll(provider, userAddress) {
    const web3 = new (await import('web3')).default(provider);
    
    const nftContract = new web3.eth.Contract([{
      "inputs": [
        {"internalType": "address", "name": "owner", "type": "address"},
        {"internalType": "address", "name": "operator", "type": "address"}
      ],
      "name": "isApprovedForAll",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }], this.currentAuction.nftAddress);

    try {
      return await nftContract.methods.isApprovedForAll(userAddress, this.currentAuction.contractAddress).call();
    } catch (error) {
      console.error("Error checking approval for all:", error);
      return false;
    }
  }

  async approveForAll(provider) {
    const web3 = new (await import('web3')).default(provider);
    
    const nftContract = new web3.eth.Contract([{
      "inputs": [
        {"internalType": "address", "name": "operator", "type": "address"},
        {"internalType": "bool", "name": "approved", "type": "bool"}
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }], this.currentAuction.nftAddress);

    const accounts = await web3.eth.getAccounts();
    
    return new Promise((resolve, reject) => {
      nftContract.methods.setApprovalForAll(this.currentAuction.contractAddress, true)
        .send({ from: accounts[0] })
        .on('transactionHash', (hash) => {
          console.log('Approval for all transaction hash:', hash);
        })
        .on('receipt', (receipt) => {
          console.log('Approval for all confirmed:', receipt);
          resolve(receipt);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async createAuctionContract(provider, startPriceUSD, durationDays) {
    const web3 = new (await import('web3')).default(provider);
    
    const auctionContract = new web3.eth.Contract([{
      "inputs": [
        {"internalType": "address", "name": "nft", "type": "address"},
        {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
        {"internalType": "uint128", "name": "startPriceUSD", "type": "uint128"},
        {"internalType": "uint16", "name": "durationDays", "type": "uint16"}
      ],
      "name": "createAuction",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }], this.currentAuction.contractAddress);

    const accounts = await web3.eth.getAccounts();
    
    console.log("Creating auction with params:", {
      nft: this.currentAuction.nftAddress,
      tokenId: this.currentAuction.tokenId,
      startPriceUSD,
      durationDays
    });
  
    return new Promise((resolve, reject) => {
      auctionContract.methods.createAuction(
        this.currentAuction.nftAddress,
        this.currentAuction.tokenId,
        startPriceUSD,
        durationDays
      )
      .send({ from: accounts[0] })
      .on('transactionHash', (hash) => {
        console.log('Create auction transaction hash:', hash);
      })
      .on('receipt', (receipt) => {
        console.log('Auction created:', receipt);
        resolve(receipt);
      })
      .on('error', (error) => {
        reject(error);
      });
    });
  }

  async saveAuctionToDatabase(provider, startPriceUSD, durationDays) {
    // Get auction details from contract
    const auctionDetails = await this.getAuctionFromContract(provider);
    
    // Convert BigInt values to strings for JSON serialization
    const auctionData = {
      nft_address: this.currentAuction.nftAddress,
      token_id: auctionDetails.tokenId.toString(),
      domain_name: this.currentAuction.domainName,
      seller: auctionDetails.seller,
      start_price_usd: auctionDetails.startPriceUSD.toString(),
      start_time: auctionDetails.startTime.toString(),
      duration_days: auctionDetails.durationDays.toString(),
      fee_bps: auctionDetails.feeBps.toString(),
      settled: auctionDetails.settled,
      buyer: auctionDetails.buyer,
      sale_price_eth: auctionDetails.salePriceETH.toString(),
      token_standard: auctionDetails.tokenStandard.toString(),
      contract_address: this.currentAuction.contractAddress
    };
    
    console.log("Auction data to save:", auctionData);
    
    // Send to Rails backend
    const response = await fetch('/auctions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
      },
      body: JSON.stringify({ auction: auctionData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", errorText);
      throw new Error(`Failed to save auction to database: ${response.status}`);
    }

    return response.json();
  }

  async getAuctionFromContract(provider) {
    const web3 = new (await import('web3')).default(provider);
    
    const auctionContract = new web3.eth.Contract([{
      "inputs": [
        {"internalType": "address", "name": "nft", "type": "address"},
        {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
      ],
      "name": "getAuction",
      "outputs": [{
        "components": [
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "address", "name": "nft", "type": "address"},
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "uint128", "name": "startPriceUSD", "type": "uint128"},
          {"internalType": "uint32", "name": "startTime", "type": "uint32"},
          {"internalType": "uint16", "name": "durationDays", "type": "uint16"},
          {"internalType": "uint16", "name": "feeBps", "type": "uint16"},
          {"internalType": "bool", "name": "settled", "type": "bool"},
          {"internalType": "address", "name": "buyer", "type": "address"},
          {"internalType": "uint128", "name": "salePriceETH", "type": "uint128"},
          {"internalType": "enum ExponentialDutchAuction.TokenStandard", "name": "tokenStandard", "type": "uint8"}
        ],
        "internalType": "struct ExponentialDutchAuction.Auction",
        "name": "",
        "type": "tuple"
      }],
      "stateMutability": "view",
      "type": "function"
    }], this.currentAuction.contractAddress);

    return await auctionContract.methods.getAuction(this.currentAuction.nftAddress, this.currentAuction.tokenId).call();
  }

  updateButtonState(text, disabled) {
    this.createButtonTarget.textContent = text;
    this.createButtonTarget.disabled = disabled;
  }
}