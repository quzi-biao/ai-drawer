import { useState, useEffect } from 'react';
import Select from '../shared/Select';
import SingleImageUpload from '../shared/SingleImageUpload';
import { ModelConfig } from '../../types';

interface ImageParametersFormProps {
  model: ModelConfig;
  onParamsChange: (params: {
    aspectRatio?: string;
    width?: number;
    height?: number;
    negativePrompt?: string;
    image?: string;
    outputFormat?: string;
    batchCount?: number;
  }) => void;
  initialParams?: {
    aspectRatio?: string;
    width?: number;
    height?: number;
    negativePrompt?: string;
    image?: string;
    outputFormat?: string;
    batchCount?: number;
  };
}

export default function ImageParametersForm({ model, onParamsChange, initialParams }: ImageParametersFormProps) {
  const [aspectRatio, setAspectRatio] = useState<string>(initialParams?.aspectRatio || '');
  const [width, setWidth] = useState<number>(initialParams?.width || 1024);
  const [height, setHeight] = useState<number>(initialParams?.height || 1024);
  const [negativePrompt, setNegativePrompt] = useState<string>(initialParams?.negativePrompt || '');
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialParams?.image || null);
  const [outputFormat, setOutputFormat] = useState<string>(initialParams?.outputFormat || 'png');
  const [batchCount, setBatchCount] = useState<number>(initialParams?.batchCount || 1);

  const needsImageUpload = model.model_type === 'i2i' || model.model_type === 'both';

  const hasAnyParams = 
    needsImageUpload ||
    (model.size_control_type === 'aspect_ratio' && model.supported_aspect_ratios && model.supported_aspect_ratios.length > 0) ||
    (model.size_control_type === 'width_height') ||
    (model.size_control_type === 'fixed_sizes' && model.fixed_sizes && model.fixed_sizes.length > 0) ||
    model.supports_negative_prompt ||
    (model.supports_batch_generation && model.max_batch_count > 1);

  if (!hasAnyParams) {
    return null;
  }

  useEffect(() => {
    if (initialParams) {
      console.log('Loading initial params:', initialParams);
      if (initialParams.aspectRatio !== undefined) setAspectRatio(initialParams.aspectRatio);
      if (initialParams.width !== undefined) setWidth(initialParams.width);
      if (initialParams.height !== undefined) setHeight(initialParams.height);
      if (initialParams.negativePrompt !== undefined) setNegativePrompt(initialParams.negativePrompt);
      if (initialParams.image !== undefined) {
        console.log('Setting uploaded image from history:', initialParams.image?.substring(0, 50) + '...');
        setUploadedImage(initialParams.image);
      }
      if (initialParams.outputFormat !== undefined) setOutputFormat(initialParams.outputFormat);
      if (initialParams.batchCount !== undefined) setBatchCount(initialParams.batchCount);
    }
  }, [JSON.stringify(initialParams)]);

  useEffect(() => {
    if (model.size_control_type === 'aspect_ratio' && model.default_aspect_ratio) {
      setAspectRatio(model.default_aspect_ratio);
    } else if (model.size_control_type === 'width_height') {
      setWidth(model.min_width || 1024);
      setHeight(model.min_height || 1024);
    }
    setNegativePrompt('');
  }, [model]);

  useEffect(() => {
    onParamsChange({
      aspectRatio,
      width,
      height,
      negativePrompt,
      image: uploadedImage || undefined,
      outputFormat,
      batchCount: model.supports_batch_generation ? batchCount : undefined,
    });
  }, [aspectRatio, width, height, negativePrompt, uploadedImage, outputFormat, batchCount, model.supports_batch_generation, onParamsChange]);

  return (
    <div className="space-y-4">
      {needsImageUpload ? (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            上传图片 {model.model_type === 'i2i' && <span className="text-red-500">*</span>}
          </label>
          <SingleImageUpload
            value={uploadedImage}
            onChange={(url) => setUploadedImage(url)}
            placeholder="上传参考图"
          />
          {model.model_type === 'i2i' && !uploadedImage && (
            <p className="text-xs text-red-500 mt-1">图生图模型需要上传参考图片</p>
          )}
        </div>
      ) : null}

      {model.size_control_type === 'aspect_ratio' && model.supported_aspect_ratios && model.supported_aspect_ratios.length > 0 ? (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">宽高比</label>
          <Select
            value={aspectRatio}
            onChange={setAspectRatio}
            options={model.supported_aspect_ratios.map(ratio => ({
              value: ratio,
              label: ratio,
            }))}
            placeholder="选择宽高比"
          />
        </div>
      ) : null}

      {model.size_control_type === 'width_height' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              宽度
              {model.min_width && model.max_width && (
                <span className="text-gray-600 font-normal ml-1">
                  ({model.min_width}-{model.max_width}px)
                </span>
              )}
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min={model.min_width || 256}
              max={model.max_width || 2048}
              step={model.size_step || 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              高度
              {model.min_height && model.max_height && (
                <span className="text-gray-600 font-normal ml-1">
                  ({model.min_height}-{model.max_height}px)
                </span>
              )}
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min={model.min_height || 256}
              max={model.max_height || 2048}
              step={model.size_step || 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
            />
          </div>
        </div>
      ) : null}

      {model.size_control_type === 'fixed_sizes' && model.fixed_sizes && model.fixed_sizes.length > 0 ? (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">尺寸</label>
          <Select
            value={model.default_size || model.fixed_sizes[0]}
            onChange={(value) => {
              console.log('Selected size:', value);
            }}
            options={model.fixed_sizes.map(size => ({
              value: size,
              label: size,
            }))}
            placeholder="选择尺寸"
          />
        </div>
      ) : null}

      {model.supports_negative_prompt ? (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">负面提示词</label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="不希望出现的内容..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900"
          />
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">输出格式</label>
        <Select
          value={outputFormat}
          onChange={setOutputFormat}
          options={[
            { value: 'png', label: 'PNG' },
            { value: 'jpeg', label: 'JPEG' },
            { value: 'webp', label: 'WebP' },
          ]}
          placeholder="选择输出格式"
        />
      </div>

      {model.supports_batch_generation && model.max_batch_count && model.max_batch_count > 1 ? (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            生成数量 (1-{model.max_batch_count})
          </label>
          <input
            type="number"
            min={1}
            max={model.max_batch_count}
            value={batchCount}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1 && val <= model.max_batch_count) {
                setBatchCount(val);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            一次生成 {batchCount} 张图片
          </p>
        </div>
      ) : null}
    </div>
  );
}
