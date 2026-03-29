const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    
    // 返回默认配置
    return this.getDefaultConfig();
  }

  getDefaultConfig() {
    return {
      cloudApiUrl: '',
      autoSaveImages: true,
      imageSaveDirectory: null
    };
  }

  saveConfig() {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    return this.saveConfig();
  }

  getAll() {
    return { ...this.config };
  }

  updateMultiple(updates) {
    this.config = { ...this.config, ...updates };
    return this.saveConfig();
  }
}

module.exports = { ConfigManager };
