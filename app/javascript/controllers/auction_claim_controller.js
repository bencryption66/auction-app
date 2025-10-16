import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["claimButton"];

  connect() {
    console.log("AuctionClaimController connected");
    this.contractAddress = "0x918B512FE14568A63Fa1bD57b7DF5c6ea6A1Df5B";
    this.checkWalletConnection();
  }

  async checkWalletConnection() {
    // Get wallet connection from the wallet-connect controller
    const walletController = this.application.getControllerForElementAndIdentifier(
      document.querySelector('[data-controller*="wallet-connect"]'), 
      'wallet-connect'
    );
    
    if (walletController && walletController.onboard) {
      console.log("Wallet controller found");
      const wallets = walletController.onboard.state.get().wallets;
      console.log("Connected wallets:", wallets);
      if (wallets.length > 0) {
        const userAddress = wallets[0].accounts[0].address;
        console.log("User address:", userAddress);
        this.showClaimButtons(userAddress);
      }
    }
  }

  showClaimButtons(userAddress) {
    // Find all auction rows
    console.log("User address:", userAddress);
    const auctionRows = this.element.querySelectorAll('tr[data-seller]');
    
    auctionRows.forEach(row => {
      const seller = row.dataset.seller;
      const isExpired = row.dataset.expired === 'true';
      const isSettled = row.dataset.settled === 'true';
      const claimButton = row.querySelector('[data-auction-claim-target="claimButton"]');
      
      // Show claim button if user is seller, auction is expired, and not settled
      if (claimButton && 
          seller.toLowerCase() === userAddress.toLowerCase() && 
          isExpired && 
          !isSettled) {
        claimButton.style.display = 'inline-block';
      }
    });
  }

  async claimBack(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const nftAddress = button.dataset.nftAddress;
    const tokenId = button.dataset.tokenId;
    
    try {
      // Get wallet connection
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

      this.updateButtonState(button, "Claiming...", true);

      await this.executeClaimBack(provider, nftAddress, tokenId);

      this.updateButtonState(button, "Claimed!", false);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Error claiming back NFT:", error);
      alert(`Error claiming back NFT: ${error.message}`);
      this.updateButtonState(button, "Claim Back", false);
    }
  }

  async executeClaimBack(provider, nftAddress, tokenId) {
    const web3 = new (await import('web3')).default(provider);
    
    const auctionContract = new web3.eth.Contract([{
      "inputs": [
        {"internalType": "address", "name": "nft", "type": "address"},
        {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
      ],
      "name": "claimBack",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }], this.contractAddress);

    const accounts = await web3.eth.getAccounts();
    
    console.log("Claiming back NFT:", { nftAddress, tokenId });
    
    return new Promise((resolve, reject) => {
      auctionContract.methods.claimBack(nftAddress, tokenId)
        .send({ from: accounts[0] })
        .on('transactionHash', (hash) => {
          console.log('Claim back transaction hash:', hash);
        })
        .on('receipt', (receipt) => {
          console.log('Claim back confirmed:', receipt);
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
