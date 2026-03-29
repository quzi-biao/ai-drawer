import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface SingleImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SingleImageUpload({
  value,
  onChange,
  placeholder = '点击或拖拽上传图片',
  disabled = false,
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    setUploading(true);
    try {
      // 转换为 base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange(base64String);
        setUploading(false);
      };
      reader.onerror = () => {
        alert('图片读取失败');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败');
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const handleClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChange(file);
        }}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-48 object-contain bg-gray-100 rounded-lg border border-gray-300"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            w-full h-48 flex flex-col items-center justify-center
            border-2 border-dashed rounded-lg cursor-pointer
            transition-colors
            ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50'}
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">上传中...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">{placeholder}</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、WebP 等格式</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
