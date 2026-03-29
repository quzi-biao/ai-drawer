const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { initDatabase } = require('./database');
const { WalletManager } = require('./wallet');
const { ApiClient } = require('./api-client');
const { ConfigManager } = require('./config');

let mainWindow;
let db;
let walletManager;
let apiClient;
let configManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // 允许加载本地文件
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    const devPort = process.env.VITE_PORT || '5173';
    mainWindow.loadURL(`http://localhost:${devPort}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // 初始化配置管理器
  const configPath = path.join(app.getPath('userData'), 'config.json');
  configManager = new ConfigManager(configPath);
  
  // 初始化数据库
  const dbPath = path.join(app.getPath('userData'), 'ai-drawer.db');
  db = initDatabase(dbPath);
  
  // 初始化钱包管理器
  const walletPath = path.join(app.getPath('userData'), 'wallet.json');
  walletManager = new WalletManager(walletPath);
  
  // 初始化 API 客户端
  const cloudApiUrl = process.env.CLOUD_API_URL || configManager.get('cloudApiUrl') || '';
  apiClient = new ApiClient(cloudApiUrl, db, walletManager);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});

// ========== IPC Handlers ==========

// 钱包相关
ipcMain.handle('wallet:getAddress', async () => {
  try {
    return { success: true, address: walletManager.getAddress() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:regenerate', async () => {
  try {
    const address = walletManager.regenerateWallet();
    return { success: true, address };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wallet:exportPrivateKey', async () => {
  try {
    const privateKey = walletManager.getPrivateKey();
    return { success: true, privateKey };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// API Key 相关
ipcMain.handle('apikey:get', async () => {
  try {
    const stmt = db.prepare('SELECT api_key, source, updated_at FROM api_keys ORDER BY id DESC LIMIT 1');
    const row = stmt.get();
    
    if (row) {
      return { 
        success: true, 
        hasApiKey: true,
        source: row.source,
        updatedAt: row.updated_at
      };
    }
    return { success: true, hasApiKey: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('apikey:fetchFromCloud', async () => {
  try {
    const result = await apiClient.fetchApiKey();
    if (result.success) {
      // 保存到数据库
      const stmt = db.prepare('INSERT OR REPLACE INTO api_keys (id, api_key, source) VALUES (1, ?, ?)');
      stmt.run(result.apiKey, 'cloud');
      return { success: true };
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('apikey:saveManual', async (event, apiKey) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO api_keys (id, api_key, source) VALUES (1, ?, ?)');
    stmt.run(apiKey, 'manual');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('apikey:delete', async () => {
  try {
    const stmt = db.prepare('DELETE FROM api_keys WHERE id = 1');
    stmt.run();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 模型相关
ipcMain.handle('models:fetch', async () => {
  try {
    console.log('Fetching models from API...');
    const result = await apiClient.fetchModels();
    console.log('Fetch result:', result);
    if (result.success) {
      // 保存到数据库
      const stmt = db.prepare('INSERT OR REPLACE INTO models (model_id, model_name, model_data) VALUES (?, ?, ?)');
      const deleteStmt = db.prepare('DELETE FROM models');
      
      deleteStmt.run();
      result.models.forEach(model => {
        stmt.run(model.model_id, model.model_name, JSON.stringify(model));
      });
      console.log(`Saved ${result.models.length} models to database`);
    }
    return result;
  } catch (error) {
    console.error('Error fetching models:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('models:getLocal', async () => {
  try {
    const stmt = db.prepare('SELECT model_data FROM models');
    const rows = stmt.all();
    const models = rows.map(row => JSON.parse(row.model_data));
    console.log(`Loaded ${models.length} models from database`);
    return { success: true, models };
  } catch (error) {
    console.error('Error loading models:', error);
    return { success: false, error: error.message };
  }
});

// 图片生成
ipcMain.handle('image:generate', async (event, params) => {
  try {
    const result = await apiClient.generateImage(params);
    
    // 保存到历史记录（成功和失败都保存）
    try {
      const stmt = db.prepare(`
        INSERT INTO generation_history (prompt, model, params, result_urls, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        params.prompt,
        params.model,
        JSON.stringify(params),
        result.success ? JSON.stringify(result.images) : null,
        result.success ? 'success' : 'failed',
        result.success ? null : result.error
      );
      console.log('History saved:', result.success ? 'success' : 'failed');
    } catch (historyError) {
      console.error('Failed to save history:', historyError);
    }
    
    return result;
  } catch (error) {
    console.error('Image generation error:', error);
    
    // 保存失败记录
    try {
      const stmt = db.prepare(`
        INSERT INTO generation_history (prompt, model, params, result_urls, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        params.prompt,
        params.model,
        JSON.stringify(params),
        null,
        'failed',
        error.message
      );
    } catch (historyError) {
      console.error('Failed to save error history:', historyError);
    }
    
    return { success: false, error: error.message };
  }
});

// 历史记录
ipcMain.handle('history:getAll', async () => {
  const fs = require('fs');
  
  try {
    const stmt = db.prepare(`
      SELECT * FROM generation_history 
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    const rows = stmt.all();
    
    // 验证图片文件是否存在
    rows.forEach(row => {
      if (row.result_urls) {
        try {
          const images = JSON.parse(row.result_urls);
          images.forEach(img => {
            if (img && img.startsWith('file://')) {
              const filePath = img.replace('file://', '');
              const exists = fs.existsSync(filePath);
              if (!exists) {
                console.warn(`Image file not found: ${filePath}`);
              } else {
                console.log(`Image file exists: ${filePath}`);
              }
            }
          });
        } catch (e) {
          console.error('Failed to parse result_urls:', e);
        }
      }
    });
    
    return { success: true, history: rows };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('history:delete', async (event, id) => {
  try {
    const stmt = db.prepare('DELETE FROM generation_history WHERE id = ?');
    stmt.run(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 设置管理
ipcMain.handle('settings:get', async (event, key) => {
  try {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key);
    return { success: true, value: row ? row.value : null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings:set', async (event, key, value) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 选择目录对话框
ipcMain.handle('dialog:selectDirectory', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: '选择图片保存目录'
  });
  
  if (result.canceled) {
    return { success: false, canceled: true };
  }
  
  return { success: true, path: result.filePaths[0] };
});

// 打开外部链接
ipcMain.handle('shell:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 配置管理
ipcMain.handle('config:get', async (event, key) => {
  try {
    if (key) {
      return { success: true, value: configManager.get(key) };
    }
    return { success: true, config: configManager.getAll() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config:set', async (event, key, value) => {
  try {
    const success = configManager.set(key, value);
    
    // 如果更新的是 API URL，重新初始化 API 客户端
    if (key === 'cloudApiUrl' && success) {
      const cloudApiUrl = value || '';
      apiClient = new ApiClient(cloudApiUrl, db, walletManager);
    }
    
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config:update', async (event, updates) => {
  try {
    const success = configManager.updateMultiple(updates);
    
    // 如果更新了 API URL，重新初始化 API 客户端
    if (updates.cloudApiUrl !== undefined && success) {
      const cloudApiUrl = updates.cloudApiUrl || '';
      apiClient = new ApiClient(cloudApiUrl, db, walletManager);
    }
    
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 修复历史记录中的图片路径
ipcMain.handle('history:fixImagePaths', async () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  try {
    // 获取图片保存目录
    const getImageDir = () => {
      const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
      const row = stmt.get('image_save_directory');
      return row && row.value ? row.value : path.join(os.homedir(), 'ai-pictures');
    };
    
    const imageDir = getImageDir();
    console.log('Image directory:', imageDir);
    
    // 获取目录中的所有图片文件
    let localFiles = [];
    if (fs.existsSync(imageDir)) {
      localFiles = fs.readdirSync(imageDir).filter(file => 
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file)
      );
      console.log(`Found ${localFiles.length} local image files`);
    }
    
    const stmt = db.prepare('SELECT * FROM generation_history WHERE status = ?');
    const rows = stmt.all('success');
    
    let fixed = 0;
    for (const row of rows) {
      if (row.result_urls) {
        try {
          const images = JSON.parse(row.result_urls);
          let needsUpdate = false;
          const fixedImages = [];
          
          for (let img of images) {
            if (!img) continue;
            
            // 如果是远程 URL，尝试找到对应的本地文件
            if (img.startsWith('http')) {
              // 根据时间戳查找最接近的本地文件
              const timestamp = new Date(row.created_at).getTime();
              const matchingFile = localFiles.find(file => {
                const fileTimestamp = parseInt(file.match(/image_(\d+)_/)?.[1] || '0');
                // 允许 5 分钟的时间差
                return Math.abs(fileTimestamp - timestamp) < 5 * 60 * 1000;
              });
              
              if (matchingFile) {
                const localPath = path.join(imageDir, matchingFile);
                fixedImages.push(`file://${localPath}`);
                needsUpdate = true;
                console.log(`Converted remote URL to local: ${matchingFile}`);
              } else {
                // 如果找不到匹配的本地文件，保留原 URL（但可能无法显示）
                fixedImages.push(img);
              }
            }
            // 如果是本地路径但没有 file:// 前缀，添加它
            else if (!img.startsWith('file://') && !img.startsWith('data:')) {
              fixedImages.push(`file://${img}`);
              needsUpdate = true;
            }
            // 已经是正确格式
            else {
              fixedImages.push(img);
            }
          }
          
          if (needsUpdate && fixedImages.length > 0) {
            const updateStmt = db.prepare('UPDATE generation_history SET result_urls = ? WHERE id = ?');
            updateStmt.run(JSON.stringify(fixedImages), row.id);
            fixed++;
          }
        } catch (e) {
          console.error('Failed to parse result_urls for row', row.id, e);
        }
      }
    }
    
    console.log(`Fixed ${fixed} history records`);
    return { success: true, fixed };
  } catch (error) {
    console.error('Failed to fix history image paths:', error);
    return { success: false, error: error.message };
  }
});
