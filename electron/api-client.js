const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ApiClient {
  constructor(baseUrl, db, walletManager) {
    this.baseUrl = baseUrl;
    this.db = db;
    this.walletManager = walletManager;
    
    // 创建 axios 实例，忽略 SSL 证书验证
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
  }

  // 生成 RSA 密钥对（用于接收加密的 API Key）
  generateRSAKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    return { publicKey, privateKey };
  }

  // 解密 API Key
  decryptApiKey(encryptedData, privateKey) {
    // 1. 解密 AES 密钥
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedData.encryptedKey, 'base64')
    );

    // 2. 解密数据
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      aesKey,
      Buffer.from(encryptedData.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));

    let decrypted = decipher.update(encryptedData.encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  // 从云端获取 API Key
  async fetchApiKey() {
    try {
      const wallet = this.walletManager.getWallet();
      const address = wallet.address;
      
      // 生成 RSA 密钥对
      const { publicKey, privateKey } = this.generateRSAKeyPair();
      
      // 准备请求参数
      const params = { address };
      const timestamp = Date.now();
      const verifyString = `address=${JSON.stringify(address)}&timestamp=${timestamp}`;
      
      // 签名
      const signature = await wallet.signMessage(verifyString);
      
      // 发送请求
      const response = await this.axiosInstance.post(`${this.baseUrl}/api/public/get-apikey/`, {
        address,
        publicKey,
        verifyString,
        signature,
        params,
        timestamp,
      });

      const result = response.data;
      
      // 处理加密响应
      let encryptedData;
      if (result._encrypted || (result.encryptedData && result.encryptedKey)) {
        encryptedData = result;
      } else if (result.success && result.encrypted && result.data) {
        encryptedData = result.data;
      } else {
        throw new Error('Invalid response format');
      }
      
      // 解密
      const decrypted = this.decryptApiKey(encryptedData, privateKey);
      
      if (decrypted.success && decrypted.apiKey) {
        return { success: true, apiKey: decrypted.apiKey };
      } else {
        return { success: false, error: decrypted.error || 'Failed to get API key' };
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取模型列表
  async fetchModels() {
    try {
      const wallet = this.walletManager.getWallet();
      const address = wallet.address;
      
      // 生成 RSA 密钥对
      const { publicKey, privateKey } = this.generateRSAKeyPair();
      
      // 准备请求参数
      const params = {
        is_active: true,
        page: 1,
        pageSize: 100
      };
      const timestamp = Date.now();
      const verifyString = `address=${JSON.stringify(address)}&timestamp=${timestamp}`;
      
      // 签名
      const signature = await wallet.signMessage(verifyString);
      
      // 发送请求
      const response = await this.axiosInstance.post(`${this.baseUrl}/api/public/image-models`, {
        address,
        publicKey,
        verifyString,
        signature,
        params,
        timestamp,
      });

      const result = response.data;
      
      // 处理加密响应
      let decrypted;
      if (result.success && result.encrypted && result.data) {
        decrypted = this.decryptApiKey(result.data, privateKey);
      } else if (result.success && result.data) {
        decrypted = result;
      } else {
        return { success: false, error: result.error || 'Failed to fetch models' };
      }
      
      if (decrypted.success && decrypted.data) {
        return { success: true, models: decrypted.data };
      } else {
        return { success: false, error: decrypted.error || 'Failed to parse models' };
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      if (error.response) {
        return { success: false, error: error.response.data?.error || error.message };
      }
      return { success: false, error: error.message };
    }
  }

  // 获取存储的 API Key
  getStoredApiKey() {
    const stmt = this.db.prepare('SELECT api_key FROM api_keys WHERE id = 1');
    const row = stmt.get();
    return row ? row.api_key : null;
  }

  // 获取图片保存目录
  getImageSaveDirectory() {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get('image_save_directory');
    
    if (row && row.value) {
      return row.value;
    }
    
    // 默认目录
    return path.join(os.homedir(), 'ai-pictures');
  }

  // 确保目录存在
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // 下载图片到本地
  async downloadImage(imageUrl, saveDir) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30秒超时
        httpsAgent: new https.Agent({ 
          rejectUnauthorized: false,
          timeout: 30000
        })
      });
      
      // 生成文件名
      const timestamp = Date.now();
      const ext = imageUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)?.[1] || 'png';
      const filename = `image_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
      const filepath = path.join(saveDir, filename);
      
      // 保存文件
      fs.writeFileSync(filepath, response.data);
      
      return filepath;
    } catch (error) {
      console.error('Failed to download image:', imageUrl, error.message);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  // 生成图片
  async generateImage(params) {
    try {
      const apiKey = this.getStoredApiKey();
      if (!apiKey) {
        return { success: false, error: 'API Key not configured' };
      }

      // 构建请求参数
      const requestPayload = {
        model: params.model,
        prompt: params.prompt,
      };

      // 只添加有值的可选参数
      if (params.aspect_ratio) {
        requestPayload.aspect_ratio = params.aspect_ratio;
      }
      if (params.width) {
        requestPayload.width = params.width;
      }
      if (params.height) {
        requestPayload.height = params.height;
      }
      if (params.negative_prompt) {
        requestPayload.negative_prompt = params.negative_prompt;
      }
      if (params.output_format) {
        requestPayload.output_format = params.output_format;
      }
      if (params.image) {
        requestPayload.image = params.image;
      }
      if (params.n && params.n > 1) {
        requestPayload.n = params.n;
      }

      console.log('Generating image with params:', JSON.stringify(requestPayload, null, 2));

      // 直接调用 302.AI API
      const apiUrl = 'https://api.302.ai/302/v2/image/generate';
      const response = await axios.post(
        apiUrl,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        }
      );

      const responseData = response.data;
      console.log('302.AI response status:', response.status);
      console.log('302.AI response data:', JSON.stringify(responseData, null, 2));
      
      // 从响应中提取图片 URL
      const remoteImages = [];
      
      if (responseData.image_urls && Array.isArray(responseData.image_urls)) {
        remoteImages.push(...responseData.image_urls);
      }
      
      if (responseData.image_url && typeof responseData.image_url === 'string') {
        remoteImages.push(responseData.image_url);
      }
      
      if (responseData.raw_response?.result?.sample) {
        remoteImages.push(responseData.raw_response.result.sample);
      }
      
      const uniqueRemoteImages = Array.from(new Set(remoteImages));
      
      if (uniqueRemoteImages.length === 0) {
        return { success: false, error: '未找到生成的图片' };
      }
      
      // 下载图片到本地
      const saveDir = this.getImageSaveDirectory();
      this.ensureDirectoryExists(saveDir);
      
      const localImages = [];
      for (const remoteUrl of uniqueRemoteImages) {
        try {
          console.log('Downloading image from:', remoteUrl);
          const localPath = await this.downloadImage(remoteUrl, saveDir);
          // 转换为 file:// URL 以便在 Electron 中显示
          const fileUrl = `file://${localPath}`;
          localImages.push(fileUrl);
          console.log('Image saved to:', localPath);
          console.log('Image URL:', fileUrl);
        } catch (error) {
          console.error('Failed to download image:', remoteUrl, error.message);
          // 如果下载失败，使用远程 URL（但可能无法显示）
          console.log('Using remote URL as fallback:', remoteUrl);
          localImages.push(remoteUrl);
        }
      }
      
      // 如果所有图片都下载失败，至少返回远程 URL
      if (localImages.length === 0) {
        console.warn('No images could be downloaded, using remote URLs');
        return { success: true, images: uniqueRemoteImages };
      }
      
      return { success: true, images: localImages };
    } catch (error) {
      console.error('Failed to generate image:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        return { success: false, error: error.response.data?.error?.message || error.message };
      }
      return { success: false, error: error.message };
    }
  }
}

module.exports = { ApiClient };
