import { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ModelConfig, GenerateParams, HistoryItem } from '../types';
import ModelSelector from './pictures/ModelSelector';
import ImageParametersForm from './pictures/ImageParametersForm';

interface ImageGeneratorProps {
  models: ModelConfig[];
  loadedHistory?: HistoryItem | null;
  onHistoryLoaded?: () => void;
}

export default function ImageGenerator({ models, loadedHistory, onHistoryLoaded }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.model_id || '');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [imageParams, setImageParams] = useState<{
    aspectRatio?: string;
    width?: number;
    height?: number;
    negativePrompt?: string;
    image?: string;
    outputFormat?: string;
    batchCount?: number;
  }>({});

  const selectedModel = models.find(m => m.model_id === selectedModelId);

  // 加载历史记录
  useEffect(() => {
    if (loadedHistory) {
      try {
        // 解析参数
        const params = JSON.parse(loadedHistory.params);
        
        // 设置模型
        if (params.model) {
          setSelectedModelId(params.model);
        }
        
        // 设置提示词
        if (loadedHistory.prompt) {
          setPrompt(loadedHistory.prompt);
        }
        
        // 设置参数
        const newParams: any = {};
        if (params.aspect_ratio) newParams.aspectRatio = params.aspect_ratio;
        if (params.width) newParams.width = params.width;
        if (params.height) newParams.height = params.height;
        if (params.negative_prompt) newParams.negativePrompt = params.negative_prompt;
        if (params.image) newParams.image = params.image;
        if (params.output_format) newParams.outputFormat = params.output_format;
        if (params.n) newParams.batchCount = params.n;
        setImageParams(newParams);
        
        // 设置生成的图片
        if (loadedHistory.result_urls) {
          try {
            const images = JSON.parse(loadedHistory.result_urls);
            if (Array.isArray(images) && images.length > 0) {
              setGeneratedImages(images);
              setSelectedImageIndex(0);
            }
          } catch (e) {
            console.error('Failed to parse result_urls:', e);
          }
        }
        
        // 清除错误
        setError('');
        
        // 通知父组件历史已加载
        if (onHistoryLoaded) {
          onHistoryLoaded();
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }
  }, [loadedHistory, onHistoryLoaded]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    if (!selectedModelId) {
      setError('请选择模型');
      return;
    }

    if (!window.electronAPI) {
      setError('应用未就绪，请稍后重试');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const params: GenerateParams = {
        prompt: prompt.trim(),
        model: selectedModelId,
      };

      // 根据模型配置添加参数
      if (selectedModel?.size_control_type === 'aspect_ratio' && imageParams.aspectRatio) {
        params.aspect_ratio = imageParams.aspectRatio;
      } else if (selectedModel?.size_control_type === 'width_height') {
        params.width = imageParams.width;
        params.height = imageParams.height;
      }

      if (selectedModel?.supports_negative_prompt && imageParams.negativePrompt?.trim()) {
        params.negative_prompt = imageParams.negativePrompt.trim();
      }

      if (imageParams.image) {
        params.image = imageParams.image;
      }

      if (imageParams.outputFormat) {
        params.output_format = imageParams.outputFormat;
      }

      if (selectedModel?.supports_batch_generation && imageParams.batchCount && imageParams.batchCount > 1) {
        params.n = imageParams.batchCount;
      }

      // 验证 i2i 模型必须有图片
      if (selectedModel?.model_type === 'i2i' && !imageParams.image) {
        setError('图生图模型需要上传参考图片');
        setGenerating(false);
        return;
      }

      const result = await window.electronAPI.image.generate(params);

      if (result.success && result.images) {
        setGeneratedImages(result.images);
        setSelectedImageIndex(result.images.length > 0 ? 0 : null);
      } else {
        setError(result.error || '生成失败');
      }
    } catch (err: any) {
      setError(err.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Input */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-lg font-semibold mb-4">生成设置</h2>

        {/* Model Selection */}
        <div className="mb-4">
          {models.length === 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              暂无可用模型，请在配置中更新模型列表
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <ModelSelector
                models={models}
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                disabled={models.length === 0}
              />
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">图片描述</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想要生成的图片..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900"
          />
        </div>

        {/* Dynamic Parameters */}
        {selectedModel && (
          <div className="mb-4">
            <ImageParametersForm
              key={JSON.stringify(imageParams)}
              model={selectedModel}
              onParamsChange={setImageParams}
              initialParams={imageParams}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        </div>
        
        {/* Generate Button - Fixed at Bottom */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim() || !selectedModel}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                生成图片
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col gap-4 p-6 bg-gray-50 overflow-hidden">
        {/* Top: Thumbnail Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">生成结果</h3>
          
          {generating ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="ml-2 text-gray-500">正在生成图片...</span>
            </div>
          ) : generatedImages.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto">
              {generatedImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative flex-shrink-0 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <ImageIcon className="w-8 h-8 mr-2" />
              <p>在左侧输入描述开始生成</p>
            </div>
          )}
        </div>

        {/* Bottom: Large Image View with Action Header */}
        {selectedImageIndex !== null && generatedImages[selectedImageIndex] && (
          <div className="flex-1 bg-gray-100 rounded-lg shadow-sm border border-gray-200 min-h-0 flex flex-col overflow-hidden">
            {/* Action Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-end gap-2">
              <a
                href={generatedImages[selectedImageIndex]}
                download
                className="group relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="下载"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  下载
                </span>
              </a>
              
              {generatedImages.length > 1 && selectedImageIndex !== null && selectedImageIndex >= 0 && (
                <button
                  onClick={() => {
                    if (selectedImageIndex === null) return;
                    const newImages = generatedImages.filter((_, idx) => idx !== selectedImageIndex);
                    setGeneratedImages(newImages);
                    setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                  }}
                  className="group relative p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    删除
                  </span>
                </button>
              )}
            </div>
            
            {/* Image Display */}
            <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
              <img
                src={generatedImages[selectedImageIndex]}
                alt="Selected image"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
