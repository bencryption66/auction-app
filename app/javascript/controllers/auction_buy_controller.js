import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["buyButton", "currentPrice"];

  connect() {
    this.priceOracleAddress = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
    this.checkWalletConnection();
    this.loadCurrentPrices();
  }

  async checkWalletConnection() {
    const walletController = this.application.getControllerForElementAndIdentifier(
      document.querySelector('[data-controller*="wallet-connect"]'), 
      'wallet-connect'
    );
    
    if (walletController && walletController.onboard) {
      const wallets = walletController.onboard.state.get().wallets;
      if (wallets.length > 0) {
        const userAddress = wallets[0].accounts[0].address;
        this.showBuyButtons(userAddress);
      }
    }
  }

  showBuyButtons(userAddress) {
    const auctionRows = this.element.querySelectorAll('tr[data-seller]');
    
    auctionRows.forEach(row => {
      const seller = row.dataset.seller;
      const isExpired = row.dataset.expired === 'true';
      const isSettled = row.dataset.settled === 'true';
      const buyButton = row.querySelector('[data-auction-buy-target="buyButton"]');
      
      if (buyButton && 
          seller.toLowerCase() !== userAddress.toLowerCase() && 
          !isExpired && 
          !isSettled) {
        buyButton.style.display = 'inline-block';
      }
    });
  }

  async loadCurrentPrices() {
    console.log("Loading current prices at:", new Date().toISOString());
    
    const walletController = this.application.getControllerForElementAndIdentifier(
      document.querySelector('[data-controller*="wallet-connect"]'), 
      'wallet-connect'
    );
    
    if (!walletController || !walletController.onboard) return;

    const wallets = walletController.onboard.state.get().wallets;
    if (wallets.length === 0) return;

    const provider = wallets[0].provider;

    for (const priceElement of this.currentPriceTargets) {
      const nftAddress = priceElement.dataset.nftAddress;
      const tokenId = priceElement.dataset.tokenId;
      const contractAddress = priceElement.closest('tr')?.querySelector('[data-contract-address]')?.dataset.contractAddress ||
                             priceElement.dataset.contractAddress;
      const auctionId = priceElement.dataset.auctionId;
      
      console.log("Processing price element:", { nftAddress, tokenId, contractAddress });
      
      if (!contractAddress) {
        console.error("No contract address found");
        continue;
      }
      
      try {
        const priceData = await fetch(`/auctions/${auctionId}/current_price`).then(res => res.json());
        console.log("Received price data:", priceData);
        
        if (priceData) {
          const ethPriceUSD = await this.getETHPriceUSD(provider);
          const ethAmount = parseFloat(priceData.priceWei) / 1e18;
          const usdAmount = ethAmount * ethPriceUSD;
          
          console.log("Calculated USD amount:", usdAmount, "ETH amount:", ethAmount);
          
          priceElement.innerHTML = `$${usdAmount.toFixed(2)} (${ethAmount.toFixed(4)} ETH)`;
        } else {
          console.log("No price data returned");
          priceElement.innerHTML = '<span class="text-muted">Inactive</span>';
        }
      } catch (error) {
        console.error("Error loading price for", tokenId, error);
        priceElement.innerHTML = '<span class="text-danger">Error</span>';
      }
    }
  }

  async getBlockchainPrice(provider, auctionId) {
    try {
      const response = await fetch(`/auctions/${auctionId}/blockchain_price`);
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  async getETHPriceUSD(provider) {
    // Create fresh Web3 instance
    const Web3 = await import('web3');
    const web3 = new Web3.default(provider);
    
    const priceOracleContract = new web3.eth.Contract([{
      "inputs": [],
      "name": "latestAnswer",
      "outputs": [{"internalType": "int256", "name": "", "type": "int256"}],
      "stateMutability": "view",
      "type": "function"
    }], this.priceOracleAddress);

    try {
      const ethPriceWei = await priceOracleContract.methods.latestAnswer().call({}, 'latest');
      const ethPrice = parseFloat(ethPriceWei) / 1e8; // Chainlink uses 8 decimals
      console.log("ETH price from oracle:", ethPrice);
      return ethPrice;
    } catch (error) {
      console.error("Error getting ETH price:", error);
      throw new Error("Failed to get ETH price from oracle");
    }
  }

  // Add manual refresh method for testing
  async refreshPrice(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const priceElement = button.parentElement.querySelector('[data-auction-buy-target="currentPrice"]');
    
    if (priceElement) {
      priceElement.innerHTML = "🔄 Refreshing...";
      console.log("=== MANUAL REFRESH TRIGGERED ===");
      
      // Clear any cached Web3 instances
      if (window.web3) {
        delete window.web3;
      }
      
      await this.loadCurrentPrices();
    }
  }

  async buy(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const contractAddress = button.dataset.contractAddress;
    const nftAddress = button.dataset.nftAddress;
    const tokenId = button.dataset.tokenId;
    const auctionId = button.dataset.auctionId;
    
    try {
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

      const provider = wallets[0].provider;

      this.updateButtonState(button, "Getting price...", true);

      // Force fresh price lookup for buy
      console.log("=== FRESH PRICE LOOKUP FOR BUY ===");
      const priceData = await this.getBlockchainPrice(provider, auctionId);
      console.log("Fresh price data for buy:", priceData);
      
      if (!priceData) {
        throw new Error("Auction is no longer active");
      }

      // Get ETH price for USD display
      const ethPriceUSD = await this.getETHPriceUSD(provider);
      const ethAmount = parseFloat(priceData.priceWei) / 1e18;
      const usdAmount = ethAmount * ethPriceUSD;

      console.log("Buy confirmation data:", {
        priceWei: priceData.priceWei,
        ethAmount,
        usdAmount,
        ethPriceUSD
      });

      // Confirm purchase with user
      const confirmed = confirm(
        `Buy this domain for $${usdAmount.toFixed(2)} (${ethAmount.toFixed(4)} ETH)?\n\nPrice fetched at: ${new Date().toLocaleTimeString()}`
      );

      if (!confirmed) {
        this.updateButtonState(button, "Buy Now", false);
        return;
      }

      this.updateButtonState(button, "Buying...", true);

      await this.executeBuy(provider, contractAddress, nftAddress, tokenId, priceData.priceWei);

      this.updateButtonState(button, "Purchased!", false);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Error buying NFT:", error);
      alert(`Error buying NFT: ${error.message}`);
      this.updateButtonState(button, "Buy Now", false);
    }
  }

  async executeBuy(provider, contractAddress, nftAddress, tokenId, priceWei) {
    const Web3 = await import('web3');
    const web3 = new Web3.default(provider);
    
    const auctionContract = new web3.eth.Contract([{
      "inputs": [
        {"internalType": "address", "name": "nft", "type": "address"},
        {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
      ],
      "name": "buy",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }], contractAddress);

    const accounts = await web3.eth.getAccounts();
    
    console.log("Executing buy transaction:", { 
      contractAddress, 
      nftAddress, 
      tokenId, 
      priceWei,
      from: accounts[0]
    });
    
    return new Promise((resolve, reject) => {
      auctionContract.methods.buy(nftAddress, tokenId)
        .send({ 
          from: accounts[0],
          value: priceWei
        })
        .on('transactionHash', (hash) => {
          console.log('Buy transaction hash:', hash);
        })
        .on('receipt', (receipt) => {
          console.log('Purchase confirmed:', receipt);
          resolve(receipt);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  updateButtonState(button, text, disabled) {
    button.textContent = text;
    button.disabled = disabled;
  }
}