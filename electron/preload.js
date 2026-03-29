const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 钱包相关
  wallet: {
    getAddress: () => ipcRenderer.invoke('wallet:getAddress'),
    regenerate: () => ipcRenderer.invoke('wallet:regenerate'),
    exportPrivateKey: () => ipcRenderer.invoke('wallet:exportPrivateKey'),
  },
  
  // API Key 相关
  apiKey: {
    get: () => ipcRenderer.invoke('apikey:get'),
    fetchFromCloud: () => ipcRenderer.invoke('apikey:fetchFromCloud'),
    saveManual: (apiKey) => ipcRenderer.invoke('apikey:saveManual', apiKey),
    delete: () => ipcRenderer.invoke('apikey:delete'),
  },
  
  // 模型相关
  models: {
    fetch: () => ipcRenderer.invoke('models:fetch'),
    getLocal: () => ipcRenderer.invoke('models:getLocal'),
  },
  
  // 图片生成
  image: {
    generate: (params) => ipcRenderer.invoke('image:generate', params),
  },
  
  // 历史记录
  history: {
    getAll: () => ipcRenderer.invoke('history:getAll'),
    delete: (id) => ipcRenderer.invoke('history:delete', id),
    fixImagePaths: () => ipcRenderer.invoke('history:fixImagePaths'),
  },
  
  // 设置
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  },
  
  // 对话框
  dialog: {
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  },
  
  // 配置管理
  config: {
    get: (key) => ipcRenderer.invoke('config:get', key),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value),
    update: (updates) => ipcRenderer.invoke('config:update', updates),
  },
  
  // Shell 操作
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },
});
