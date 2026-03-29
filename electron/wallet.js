const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class WalletManager {
  constructor(walletPath) {
    this.walletPath = walletPath;
    this.wallet = null;
    this.loadOrCreateWallet();
  }

  loadOrCreateWallet() {
    if (fs.existsSync(this.walletPath)) {
      try {
        const data = fs.readFileSync(this.walletPath, 'utf8');
        const { privateKey } = JSON.parse(data);
        this.wallet = new ethers.Wallet(privateKey);
        console.log('Wallet loaded:', this.wallet.address);
      } catch (error) {
        console.error('Failed to load wallet, creating new one:', error);
        this.createNewWallet();
      }
    } else {
      this.createNewWallet();
    }
  }

  createNewWallet() {
    this.wallet = ethers.Wallet.createRandom();
    this.saveWallet();
    console.log('New wallet created:', this.wallet.address);
  }

  saveWallet() {
    const data = {
      address: this.wallet.address,
      privateKey: this.wallet.privateKey,
      createdAt: new Date().toISOString(),
    };
    
    // 确保目录存在
    const dir = path.dirname(this.walletPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.walletPath, JSON.stringify(data, null, 2), 'utf8');
  }

  getAddress() {
    return this.wallet ? this.wallet.address : null;
  }

  getPrivateKey() {
    return this.wallet ? this.wallet.privateKey : null;
  }

  async signMessage(message) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return await this.wallet.signMessage(message);
  }

  regenerateWallet() {
    this.createNewWallet();
    return this.wallet.address;
  }

  getWallet() {
    return this.wallet;
  }
}

module.exports = { WalletManager };
