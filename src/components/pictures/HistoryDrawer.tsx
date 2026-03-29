import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { HistoryItem } from '../../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadHistory?: (item: HistoryItem) => void;
}

export default function HistoryDrawer({ isOpen, onClose, onLoadHistory }: HistoryDrawerProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.history.getAll();
      if (result.success && result.history) {
        setHistory(result.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const extractImages = (resultUrls: string): string[] => {
    try {
      if (!resultUrls) return [];
      const parsed = JSON.parse(resultUrls);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="absolute right-0 top-0 bottom-0 w-full sm:max-w-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">生成历史</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400">暂无历史记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const images = extractImages(item.result_urls);
                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (onLoadHistory) {
                        onLoadHistory(item);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {item.model}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatTime(item.created_at)}
                      </span>
                    </div>

                    {item.prompt && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase">Prompt</p>
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {item.prompt}
                        </p>
                      </div>
                    )}

                    {images.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-400 mb-2 uppercase">
                          生成图片 ({images.length})
                        </p>
                        <div className="flex gap-2 overflow-x-auto">
                          {images.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="relative flex-shrink-0 h-[100px] rounded-lg overflow-hidden bg-gray-200 hover:opacity-80 transition-opacity group"
                            >
                              <img
                                src={url}
                                alt={`Generated ${idx + 1}`}
                                className="h-full w-auto object-contain"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.created_at)}</span>
                      </div>
                    </div>

                    {item.error_message && (
                      <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-600">{item.error_message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
