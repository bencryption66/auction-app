import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["currentPrice", "countdown"];
  static values = { 
    auctionId: Number,
    refreshInterval: { type: Number, default: 30000 }, // 30 seconds
    endTime: String
  };

  connect() {
    this.startRefreshing();
    this.startCountdown();
  }

  disconnect() {
    this.stopRefreshing();
    this.stopCountdown();
  }

  startRefreshing() {
    // Update price immediately
    this.updatePrice();
    
    // Then update every 30 seconds
    this.refreshTimer = setInterval(() => {
      this.updatePrice();
    }, this.refreshIntervalValue);
  }

  stopRefreshing() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  startCountdown() {
    if (!this.endTimeValue) return;
    
    // Update countdown immediately
    this.updateCountdown();
    
    // Then update every second
    this.countdownTimer = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  stopCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  updateCountdown() {
    if (!this.hasCountdownTarget || !this.endTimeValue) return;
    
    const endTime = new Date(this.endTimeValue);
    const now = new Date();
    const timeRemaining = endTime - now;
    
    if (timeRemaining <= 0) {
      this.countdownTarget.innerHTML = "Expired";
      this.stopCountdown();
      // Also refresh the price when auction expires
      this.updatePrice();
      return;
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    let countdownText = '';
    if (days > 0) {
      countdownText = `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hour' : 'hours'}, ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else if (hours > 0) {
      countdownText = `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    } else if (minutes > 0) {
      countdownText = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    } else {
      countdownText = `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    }
    
    this.countdownTarget.innerHTML = countdownText;
  }

  async updatePrice() {
    try {
      const response = await fetch(`/auctions/${this.auctionIdValue}/current_price`);
      if (!response.ok) return;
      
      const data = await response.json();
      
      // Update the price display
      if (this.hasCurrentPriceTarget) {
        this.currentPriceTarget.innerHTML = `
          <div class="h3 mb-1 fw-bold ${this.getStatusClass(data.status)}">
            ${data.price}
          </div>
          <small class="text-muted">${this.getStatusText(data.status)}</small>
        `;
      }
      
      // Stop refreshing if auction is settled or expired
      if (data.settled || data.expired) {
        this.stopRefreshing();
        this.stopCountdown();
        
        // Hide/show appropriate UI elements
        this.updateUIForEndedAuction(data);
      }
      
    } catch (error) {
      console.error('Error updating price:', error);
    }
  }

  updateUIForEndedAuction(data) {
    // Hide time remaining section if expired
    if (data.expired) {
      const timeRemainingSection = document.querySelector('.time-remaining');
      if (timeRemainingSection) {
        timeRemainingSection.style.display = 'none';
      }
      
      // Show expired notice
      const expiredNotice = document.getElementById('expired-notice');
      if (expiredNotice) {
        expiredNotice.style.display = 'block';
      }
      
      // Hide connect notice and show claim button for sellers
      const connectNotice = document.getElementById('connect-notice');
      if (connectNotice) {
        connectNotice.style.display = 'none';
      }
    }
  }

  getStatusClass(status) {
    switch (status) {
      case 'sold': return 'text-success';
      case 'expired': return 'text-warning';
      case 'active': return '';
      default: return '';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'sold': return 'Final Sale Price';
      case 'expired': return 'Auction has ended';
      case 'active': return 'Price decreases over time';
      default: return '';
    }
  }
}
