import { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Eye, EyeOff, AlertCircle, Folder } from 'lucide-react';

interface ConfigDialogProps {
  onClose: () => void;
  onSaved: () => void;
  walletAddress: string;
}

export default function ConfigDialog({ onClose, onSaved, walletAddress }: ConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<'apikey' | 'wallet' | 'settings'>('apikey');
  const [manualApiKey, setManualApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeySource, setApiKeySource] = useState<'cloud' | 'manual' | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [imageSaveDir, setImageSaveDir] = useState('');
  const [cloudApiUrl, setCloudApiUrl] = useState('');

  useEffect(() => {
    loadApiKeyStatus();
    loadImageSaveDirectory();
    loadCloudApiUrl();
  }, []);

  const loadApiKeyStatus = async () => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      return;
    }
    
    const result = await window.electronAPI.apiKey.get();
    if (result.success) {
      setHasApiKey(result.hasApiKey || false);
      setApiKeySource(result.source as 'cloud' | 'manual' | null);
    }
  };

  const handleFetchFromCloud = async () => {
    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.electronAPI.apiKey.fetchFromCloud();
      if (result.success) {
        setSuccess('API Key 已从云端获取并保存');
        setHasApiKey(true);
        setApiKeySource('cloud');
        setTimeout(() => {
          onSaved();
        }, 1500);
      } else {
        setError(result.error || '获取失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualApiKey.trim()) {
      setError('请输入 API Key');
      return;
    }

    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.electronAPI.apiKey.saveManual(manualApiKey);
      if (result.success) {
        setSuccess('API Key 已保存');
        setHasApiKey(true);
        setApiKeySource('manual');
        setManualApiKey('');
        setTimeout(() => {
          onSaved();
        }, 1500);
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('确定要删除 API Key 吗？')) return;

    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.apiKey.delete();
      if (result.success) {
        setSuccess('API Key 已删除');
        setHasApiKey(false);
        setApiKeySource(null);
      } else {
        setError(result.error || '删除失败');
      }
    } catch (err: any) {
      setError(err.message || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateWallet = async () => {
    if (!confirm('重新生成钱包将清空当前钱包，需要联系管理员重新绑定。确定继续吗？')) return;

    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.wallet.regenerate();
      if (result.success) {
        setSuccess('钱包已重新生成，请联系管理员更新地址');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(result.error || '生成失败');
      }
    } catch (err: any) {
      setError(err.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPrivateKey = async () => {
    if (!confirm('导出私钥存在安全风险，请妥善保管。确定继续吗？')) return;

    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    try {
      const result = await window.electronAPI.wallet.exportPrivateKey();
      if (result.success && result.privateKey) {
        setPrivateKey(result.privateKey);
        setShowPrivateKey(true);
      } else {
        setError(result.error || '导出失败');
      }
    } catch (err: any) {
      setError(err.message || '导出失败');
    }
  };

  const handleFetchModels = async () => {
    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.electronAPI.models.fetch();
      if (result.success) {
        setSuccess('模型列表已更新');
      } else {
        setError(result.error || '获取失败');
      }
    } catch (err: any) {
      setError(err.message || '获取失败');
    } finally {
      setLoading(false);
    }
  };

  const loadImageSaveDirectory = async () => {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.settings.get('image_save_directory');
      if (result.success && result.value) {
        setImageSaveDir(result.value);
      } else {
        // 使用默认目录
        const os = require('os');
        const path = require('path');
        setImageSaveDir(path.join(os.homedir(), 'ai-pictures'));
      }
    } catch (err) {
      console.error('Failed to load image save directory:', err);
    }
  };

  const loadCloudApiUrl = async () => {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.config.get('cloudApiUrl');
      if (result.success && result.value) {
        setCloudApiUrl(result.value);
      }
    } catch (err) {
      console.error('Failed to load cloud API URL:', err);
    }
  };

  const handleSaveCloudApiUrl = async () => {
    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.electronAPI.config.set('cloudApiUrl', cloudApiUrl);
      if (result.success) {
        setSuccess('API URL 已保存');
      } else {
        setError('保存失败');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDirectory = async () => {
    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    try {
      const result = await window.electronAPI.dialog.selectDirectory();
      if (result.success && result.path) {
        setImageSaveDir(result.path);
        
        // 保存到数据库
        const saveResult = await window.electronAPI.settings.set('image_save_directory', result.path);
        if (saveResult.success) {
          setSuccess('图片保存目录已更新');
        }
      }
    } catch (err: any) {
      setError(err.message || '选择目录失败');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">配置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('apikey')}
            className={`flex-1 px-6 py-3 font-medium ${
              activeTab === 'apikey'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            API Key 配置
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 px-6 py-3 font-medium ${
              activeTab === 'wallet'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            钱包管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-3 font-medium ${
              activeTab === 'settings'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            设置
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {success}
            </div>
          )}

          {activeTab === 'apikey' && (
            <div className="space-y-6">
              {/* 当前状态 */}
              <div>
                <h3 className="font-medium mb-2">当前状态</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {hasApiKey ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 font-medium">✓ API Key 已配置</p>
                        <p className="text-sm text-gray-600 mt-1">
                          来源: {apiKeySource === 'cloud' ? '云端获取' : '手动填写'}
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteApiKey}
                        disabled={loading}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-600">未配置 API Key</p>
                  )}
                </div>
              </div>

              {/* 从云端获取 */}
              <div>
                <h3 className="font-medium mb-2">从云端获取</h3>
                <p className="text-sm text-gray-600 mb-3">
                  使用您的钱包地址从云端获取 API Key（需要管理员预先配置）
                </p>
                <button
                  onClick={handleFetchFromCloud}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  {loading ? '获取中...' : '从云端获取'}
                </button>
              </div>

              {/* 手动填写 */}
              <div>
                <h3 className="font-medium mb-2">手动填写</h3>
                <p className="text-sm text-gray-600 mb-3">
                  如果您已有 API Key，可以直接填写
                </p>
                <textarea
                  value={manualApiKey}
                  onChange={(e) => setManualApiKey(e.target.value)}
                  placeholder="请输入 API Key"
                  className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
                <button
                  onClick={handleSaveManual}
                  disabled={loading || !manualApiKey.trim()}
                  className="w-full mt-3 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>

              {/* 更新模型列表 */}
              <div>
                <h3 className="font-medium mb-2">模型列表</h3>
                <p className="text-sm text-gray-600 mb-3">
                  从云端获取最新的模型列表
                </p>
                <button
                  onClick={handleFetchModels}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  {loading ? '更新中...' : '更新模型列表'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {/* 钱包地址 */}
              <div>
                <h3 className="font-medium mb-2">钱包地址</h3>
                <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm break-all">
                  {walletAddress}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  这是您的唯一标识，用于从云端获取 API Key
                </p>
              </div>

              {/* 导出私钥 */}
              <div>
                <h3 className="font-medium mb-2">导出私钥</h3>
                <p className="text-sm text-gray-600 mb-3">
                  导出私钥用于备份，请妥善保管
                </p>
                {!showPrivateKey ? (
                  <button
                    onClick={handleExportPrivateKey}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                    显示私钥
                  </button>
                ) : (
                  <div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg font-mono text-sm break-all">
                      {privateKey}
                    </div>
                    <button
                      onClick={() => setShowPrivateKey(false)}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <EyeOff className="w-5 h-5" />
                      隐藏私钥
                    </button>
                  </div>
                )}
              </div>

              {/* 重新生成钱包 */}
              <div>
                <h3 className="font-medium mb-2 text-red-600">重新生成钱包</h3>
                <p className="text-sm text-gray-600 mb-3">
                  ⚠️ 重新生成将清空当前钱包，需要联系管理员重新绑定地址
                </p>
                <button
                  onClick={handleRegenerateWallet}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 inline mr-2" />
                  {loading ? '生成中...' : '重新生成钱包'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Cloud API URL */}
              <div>
                <h3 className="font-medium mb-2">Cloud API URL</h3>
                <p className="text-sm text-gray-600 mb-3">
                  配置云端 API 服务器地址
                </p>
                <input
                  type="text"
                  value={cloudApiUrl}
                  onChange={(e) => setCloudApiUrl(e.target.value)}
                  placeholder="例如: https://api.example.com:5443"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                />
                <button
                  onClick={handleSaveCloudApiUrl}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                >
                  {loading ? '保存中...' : '保存 API URL'}
                </button>
              </div>

              {/* 图片保存目录 */}
              <div>
                <h3 className="font-medium mb-2">图片保存目录</h3>
                <p className="text-sm text-gray-600 mb-3">
                  生成的图片将保存到此目录
                </p>
                <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm break-all mb-3">
                  {imageSaveDir || '~/ai-pictures (默认)'}
                </div>
                <button
                  onClick={handleSelectDirectory}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Folder className="w-5 h-5" />
                  选择目录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
