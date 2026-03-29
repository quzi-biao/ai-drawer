import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, HelpCircle } from 'lucide-react';
import { ModelConfig } from '../../types';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function ModelSelector({
  models,
  selectedModelId,
  onModelChange,
  disabled = false,
  className = '',
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = models.find(m => m.model_id === selectedModelId);

  const filteredModels = models.filter(model => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      model.model_id.toLowerCase().includes(query) ||
      model.model_name.toLowerCase().includes(query) ||
      model.model_description.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getModelTypeBadge = (type: 't2i' | 'i2i' | 'both') => {
    const config = {
      t2i: { label: '文生图', color: 'bg-blue-100 text-blue-700' },
      i2i: { label: '图生图', color: 'bg-green-100 text-green-700' },
      both: { label: '通用', color: 'bg-purple-100 text-purple-700' },
    };
    const { label, color } = config[type];
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{selectedModel?.model_id || '选择模型'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {selectedModel && (selectedModel.model_description || (selectedModel.notes && selectedModel.notes.trim() && selectedModel.notes !== '0')) && (
          <div className="hidden lg:flex group relative items-center">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="fixed left-52 top-[110px] w-80 max-w-[90vw] max-h-[80vh] overflow-y-auto p-3 bg-gray-900 text-white text-xs rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none group-hover:pointer-events-auto">
              {selectedModel.model_description && (
                <div className="mb-2">
                  <div className="font-semibold text-indigo-300 mb-1">模型描述</div>
                  <div>{selectedModel.model_description}</div>
                </div>
              )}
              {selectedModel.notes && selectedModel.notes.trim() && selectedModel.notes !== '0' && (
                <div className={selectedModel.model_description ? 'pt-2 border-t border-gray-700' : ''}>
                  <div className="font-semibold text-indigo-300 mb-1">使用说明</div>
                  <div className="whitespace-pre-wrap">{selectedModel.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isOpen && models.length > 0 && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模型..."
                className="w-full pl-9 pr-9 py-2 text-sm text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto py-1">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <button
                  key={model.model_id}
                  onClick={() => handleModelSelect(model.model_id)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                    selectedModelId === model.model_id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{model.model_id}</span>
                    {getModelTypeBadge(model.model_type)}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1">{model.model_description}</div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                未找到匹配的模型
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
