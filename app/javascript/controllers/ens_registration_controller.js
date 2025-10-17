import { Controller } from "@hotwired/stimulus";
import { Modal } from "bootstrap";

export default class extends Controller {
  static targets = [
    "registerButton", "modal", "modalTitle", "modalBody",
    "nameInput", "durationInput", "durationTypeSelect", "premiumInput",
    "baseCost", "premiumCost", "totalCost", "costCard",
    "startRegistrationButton", "registrationForm", "progressView",
    "progressBar", "stepTitle", "stepDescription", "statusAlert"
  ];

  connect() {
    this.ensRegistrarAddress = "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5";
    this.ensResolverAddress = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41";
    this.commitments = new Map();
    this.selectedName = "";
    this.selectedPremium = 0;
    this.checkWalletConnection();
  }

  async checkWalletConnection() {
    const walletController = this.application.getControllerForElementAndIdentifier(
      document.querySelector('[data-controller*="wallet-connect"]'), 
      'wallet-connect'
    );
    
    if (walletController?.onboard) {
      const wallets = walletController.onboard.state.get().wallets;
      if (wallets.length > 0) {
        this.registerButtonTargets.forEach(button => {
          button.style.display = 'inline-block';
        });
      }
    }
  }

  openModal(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    this.selectedName = button.dataset.name;
    this.selectedPremium = parseFloat(button.dataset.premium || 0);
    
    if (!this.selectedName) {
      alert("Name not found");
      return;
    }

    // Populate the modal form fields
    this.populateModalForm();
    this.updateCost();
    
    // Show the modal
    this.showModal();
  }
  // Called when "Register Here" button is clicked
  register(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    this.selectedName = button.dataset.name;
    this.selectedPremium = parseFloat(button.dataset.premium || 0);
    
    if (!this.selectedName) {
      alert("Name not found");
      return;
    }

    // Populate the modal form fields
    this.populateModalForm();
    
    // Show the modal
    this.showModal();
    
    // Calculate initial cost
    this.updateCost();
  }

  populateModalForm() {
    // Update modal title
    this.modalTitleTarget.textContent = `Register ${this.selectedName}.eth`;
    
    // Populate form fields
    this.nameInputTarget.value = this.selectedName;
    this.premiumInputTarget.value = `$${this.selectedPremium.toFixed(2)}`;
    
    // Reset duration to defaults
    this.durationInputTarget.value = 1;
    this.durationTypeSelectTarget.value = 'years';
    
    // Show form, hide progress
    this.registrationFormTarget.classList.remove('d-none');
    this.progressViewTarget.classList.add('d-none');
    
    // Disable start button until cost is calculated
    this.startRegistrationButtonTarget.disabled = true;
  }

  showModal() {
    const modalElement = this.modalTarget;
    const modal = new Modal(modalElement, {
      backdrop: 'static',
      keyboard: false
    });
    modal.show();
    this.modalInstance = modal;
  }

  hideModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  // Called when duration inputs change
  async updateCost() {
    try {
      const walletController = this.application.getControllerForElementAndIdentifier(
        document.querySelector('[data-controller*="wallet-connect"]'), 
        'wallet-connect'
      );
      
      if (!walletController?.onboard) {
        return;
      }

      const wallets = walletController.onboard.state.get().wallets;
      if (wallets.length === 0) {
        return;
      }

      const provider = wallets[0].provider;
      const web3 = new (await import('web3')).default(provider);
      
      // Show loading state
      this.baseCostTarget.textContent = "Calculating...";
      this.totalCostTarget.textContent = "Calculating...";
      this.startRegistrationButtonTarget.disabled = true;
      
      const cost = await this.getRegistrationCost(web3, this.selectedName, this.selectedPremium);
      
      // Update cost display
      this.baseCostTarget.textContent = `${(parseFloat(cost.base) / 1e18).toFixed(4)} ETH`;
      this.premiumCostTarget.textContent = `${(parseFloat(cost.premium) / 1e18).toFixed(4)} ETH`;
      this.totalCostTarget.textContent = `${(parseFloat(cost.total) / 1e18).toFixed(4)} ETH`;
      
      // Enable start button
      this.startRegistrationButtonTarget.disabled = false;
      
    } catch (error) {
      console.error("Error calculating cost:", error);
      this.baseCostTarget.textContent = "Error";
      this.totalCostTarget.textContent = "Error";
      this.startRegistrationButtonTarget.disabled = true;
    }
  }

  // Called when "Start Registration" button is clicked
  async startRegistration() {
    try {
      // Hide form, show progress
      this.registrationFormTarget.classList.add('d-none');
      this.progressViewTarget.classList.remove('d-none');
      
      // Get wallet info
      const walletController = this.application.getControllerForElementAndIdentifier(
        document.querySelector('[data-controller*="wallet-connect"]'), 
        'wallet-connect'
      );
      
      const wallets = walletController.onboard.state.get().wallets;
      const provider = wallets[0].provider;
      const address = wallets[0].accounts[0].address;
      
      // Start the registration process
      await this.executeRegistration(provider, address);
      
    } catch (error) {
      console.error("Registration error:", error);
      this.showError(`Registration failed: ${error.message}`);
    }
  }

  async executeRegistration(provider, address) {
    const web3 = new (await import('web3')).default(provider);
    
    // Step 1: Check availability
    this.updateStep(1, "Checking Availability", "Verifying name is available for registration");
    this.updateProgress(10);
    
    const isAvailable = await this.checkAvailability(web3, this.selectedName);
    if (!isAvailable) {
      throw new Error("This name is not available for registration");
    }

    // Step 2: Get final cost
    this.updateStep(1, "Calculating Final Cost", "Getting registration price from ENS contract");
    this.updateProgress(20);
    
    const cost = await this.getRegistrationCost(web3, this.selectedName, this.selectedPremium);

    // Step 3: Make commitment
    this.updateStep(1, "Creating Commitment", "Generating secure commitment hash");
    this.updateProgress(30);
    
    const commitment = await this.makeCommitment(web3, address, this.selectedName);
    
    this.updateStep(1, "Submitting Commitment", "Sending commitment transaction to blockchain");
    this.updateProgress(40);
    
    await this.submitCommitment(web3, address, commitment);
    
    // Store commitment
    this.commitments.set(this.selectedName, {
      commitment,
      timestamp: Date.now(),
      cost: cost.total,
      address,
      duration: this.getDurationInSeconds()
    });

    this.updateProgress(50);

    // Step 4: Wait 60 seconds
    this.updateStep(2, "Waiting Period", "60 second security delay required by ENS");
    await this.startCountdown(60);
  }

  async startCountdown(seconds) {
    let remaining = seconds;
    
    const countdown = setInterval(() => {
      this.updateStep(2, `Waiting Period (${remaining}s)`, "Security delay prevents front-running attacks");
      this.updateProgress(50 + (50 * (60 - remaining) / 60));
      remaining--;
      
      if (remaining < 0) {
        clearInterval(countdown);
        this.completeRegistration();
      }
    }, 1000);
  }

  async completeRegistration() {
    try {
      this.updateStep(3, "Registering Name", "Completing final registration transaction");
      this.updateProgress(90);
      
      const walletController = this.application.getControllerForElementAndIdentifier(
        document.querySelector('[data-controller*="wallet-connect"]'), 
        'wallet-connect'
      );
      
      const wallets = walletController.onboard.state.get().wallets;
      const provider = wallets[0].provider;
      const address = wallets[0].accounts[0].address;
      
      const commitmentData = this.commitments.get(this.selectedName);
      if (!commitmentData) {
        throw new Error("Commitment not found. Please start over.");
      }

      const web3 = new (await import('web3')).default(provider);
      
      // Register the name (simplified contract call)
      const registrarContract = new web3.eth.Contract([{
        "inputs": [
          {"internalType": "string", "name": "name", "type": "string"},
          {"internalType": "address", "name": "owner", "type": "address"},
          {"internalType": "uint256", "name": "duration", "type": "uint256"},
          {"internalType": "bytes32", "name": "secret", "type": "bytes32"}
        ],
        "name": "register",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      }], this.ensRegistrarAddress);

      await new Promise((resolve, reject) => {
        registrarContract.methods.register(
          this.selectedName,
          address,
          commitmentData.duration,
          commitmentData.commitment.secret
        ).send({ 
          from: address,
          value: commitmentData.cost
        })
        .on('transactionHash', (hash) => {
          this.updateStep(3, "Transaction Submitted", `Hash: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', (receipt) => {
          resolve(receipt);
        })
        .on('error', (error) => {
          reject(error);
        });
      });

      this.updateProgress(100);
      this.updateStep(3, "Registration Complete!", "Your ENS name is now registered");
      
      // Clean up
      this.commitments.delete(this.selectedName);
      
      // Show success
      setTimeout(() => {
        this.showSuccess();
      }, 1000);

    } catch (error) {
      this.showError(`Registration failed: ${error.message}`);
    }
  }

  showSuccess() {
    this.statusAlertTarget.className = "alert alert-success";
    this.statusAlertTarget.innerHTML = `
      <div class="d-flex">
        <i class="fas fa-check-circle text-success me-2 mt-1"></i>
        <div>
          <strong>Success!</strong> ${this.selectedName}.eth has been registered to your wallet.
        </div>
      </div>
    `;
  }

  showError(message) {
    this.statusAlertTarget.className = "alert alert-danger";
    this.statusAlertTarget.innerHTML = `
      <div class="d-flex">
        <i class="fas fa-exclamation-triangle text-danger me-2 mt-1"></i>
        <div>
          <strong>Error:</strong> ${message}
        </div>
      </div>
    `;
  }

  updateStep(step, title, description) {
    this.stepTitleTarget.textContent = `Step ${step}: ${title}`;
    this.stepDescriptionTarget.textContent = description;
  }

  updateProgress(percentage) {
    this.progressBarTarget.style.width = `${percentage}%`;
    this.progressBarTarget.setAttribute('aria-valuenow', percentage);
  }

  getDurationInSeconds() {
    const duration = parseInt(this.durationInputTarget.value);
    const durationType = this.durationTypeSelectTarget.value;
    
    if (durationType === 'months') {
      return duration * 30 * 24 * 60 * 60; // Approximate month as 30 days
    } else {
      return duration * 365 * 24 * 60 * 60; // Year
    }
  }

  // ... keep your existing ENS contract methods ...
  
  async checkAvailability(web3, name) {
    const registrarContract = new web3.eth.Contract([{
      "inputs": [{"internalType": "string", "name": "name", "type": "string"}],
      "name": "available",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }], this.ensRegistrarAddress);

    return await registrarContract.methods.available(name).call();
  }

  async getRegistrationCost(web3, name, premiumUSD = 0) {
    const registrarContract = new web3.eth.Contract([{
      "inputs": [
        {"internalType": "string", "name": "name", "type": "string"},
        {"internalType": "uint256", "name": "duration", "type": "uint256"}
      ],
      "name": "rentPrice",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }], this.ensRegistrarAddress);

    const duration = this.getDurationInSeconds();
    const baseCost = await registrarContract.methods.rentPrice(name, duration).call();
    
    const ethPriceUSD = 4000; // Should fetch from oracle
    const premiumWei = Math.floor((premiumUSD / ethPriceUSD) * 1e18);
    
    const totalCost = (BigInt(baseCost) + BigInt(premiumWei)).toString();

    return {
      base: baseCost,
      premium: premiumWei.toString(),
      total: totalCost
    };
  }

  async makeCommitment(web3, address, name) {
    const secret = web3.utils.randomHex(32);
    const registrarContract = new web3.eth.Contract([{
      "inputs": [
        {"internalType": "string", "name": "name", "type": "string"},
        {"internalType": "address", "name": "owner", "type": "address"},
        {"internalType": "bytes32", "name": "secret", "type": "bytes32"}
      ],
      "name": "makeCommitment",
      "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
      "stateMutability": "pure",
      "type": "function"
    }], this.ensRegistrarAddress);

    const commitment = await registrarContract.methods.makeCommitment(
      name,
      address,
      secret
    ).call();

    return { commitment, secret };
  }

  async submitCommitment(web3, address, commitmentData) {
    const registrarContract = new web3.eth.Contract([{
      "inputs": [{"internalType": "bytes32", "name": "commitment", "type": "bytes32"}],
      "name": "commit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }], this.ensRegistrarAddress);

    return new Promise((resolve, reject) => {
      registrarContract.methods.commit(commitmentData.commitment)
        .send({ from: address })
        .on('transactionHash', (hash) => {
          console.log('Commitment transaction hash:', hash);
        })
        .on('receipt', (receipt) => {
          resolve(receipt);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}
