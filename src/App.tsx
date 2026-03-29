import { useState, useEffect } from 'react';
import { Settings, History, HelpCircle } from 'lucide-react';
import ImageGenerator from './components/ImageGenerator';
import ConfigDialog from './components/ConfigDialog';
import GuideDialog from './components/GuideDialog';
import HistoryDrawer from './components/pictures/HistoryDrawer';
import { ModelConfig, HistoryItem } from './types';

function App() {
  const [configOpen, setConfigOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loadedHistory, setLoadedHistory] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      return;
    }

    // 加载钱包地址
    const addressResult = await window.electronAPI.wallet.getAddress();
    if (addressResult.success && addressResult.address) {
      setWalletAddress(addressResult.address);
    }

    // 检查 API Key
    const apiKeyResult = await window.electronAPI.apiKey.get();
    if (apiKeyResult.success) {
      setHasApiKey(apiKeyResult.hasApiKey || false);
    }

    // 加载本地模型
    const modelsResult = await window.electronAPI.models.getLocal();
    if (modelsResult.success && modelsResult.models) {
      setModels(modelsResult.models);
      console.log('Loaded models:', modelsResult.models.length);
    } else {
      console.log('No models found in database');
    }

    // 修复历史记录中的图片路径
    try {
      const fixResult = await window.electronAPI.history.fixImagePaths();
      if (fixResult.success && fixResult.fixed && fixResult.fixed > 0) {
        console.log(`Fixed ${fixResult.fixed} history records with incorrect image paths`);
      }
    } catch (error) {
      console.error('Failed to fix history image paths:', error);
    }
  };

  const handleConfigSaved = () => {
    loadInitialData();
    setConfigOpen(false);
  };

  const handleLoadHistory = (item: HistoryItem) => {
    console.log('Load history item:', item);
    setLoadedHistory(item);
    setHistoryOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">AI Drawer</h1>
          {walletAddress && (
            <div className="text-sm text-gray-500">
              地址: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
            title="操作引导"
          >
            <HelpCircle className="w-4 h-4" />
            <span>引导</span>
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
            <span>历史</span>
          </button>
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>配置</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {!hasApiKey ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-4">请先配置 API Key</p>
              <button
                onClick={() => setConfigOpen(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                前往配置
              </button>
            </div>
          </div>
        ) : (
          <ImageGenerator 
            models={models} 
            loadedHistory={loadedHistory}
            onHistoryLoaded={() => setLoadedHistory(null)}
          />
        )}
      </main>

      {/* Guide Dialog */}
      {guideOpen && (
        <GuideDialog onClose={() => setGuideOpen(false)} />
      )}

      {/* Config Dialog */}
      {configOpen && (
        <ConfigDialog
          onClose={() => setConfigOpen(false)}
          onSaved={handleConfigSaved}
          walletAddress={walletAddress}
        />
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadHistory={handleLoadHistory}
      />
    </div>
  );
}

export default App;
