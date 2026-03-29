export interface ElectronAPI {
  wallet: {
    getAddress: () => Promise<{ success: boolean; address?: string; error?: string }>;
    regenerate: () => Promise<{ success: boolean; address?: string; error?: string }>;
    exportPrivateKey: () => Promise<{ success: boolean; privateKey?: string; error?: string }>;
  };
  apiKey: {
    get: () => Promise<{ success: boolean; hasApiKey?: boolean; source?: string; updatedAt?: string; error?: string }>;
    fetchFromCloud: () => Promise<{ success: boolean; error?: string }>;
    saveManual: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
    delete: () => Promise<{ success: boolean; error?: string }>;
  };
  models: {
    fetch: () => Promise<{ success: boolean; models?: ModelConfig[]; error?: string }>;
    getLocal: () => Promise<{ success: boolean; models?: ModelConfig[]; error?: string }>;
  };
  image: {
    generate: (params: GenerateParams) => Promise<{ success: boolean; images?: string[]; error?: string }>;
  };
  history: {
    getAll: () => Promise<{ success: boolean; history?: HistoryItem[]; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
    fixImagePaths: () => Promise<{ success: boolean; fixed?: number; error?: string }>;
  };
  settings: {
    get: (key: string) => Promise<{ success: boolean; value?: string | null; error?: string }>;
    set: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  };
  dialog: {
    selectDirectory: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
  };
  config: {
    get: (key?: string) => Promise<{ success: boolean; value?: any; config?: any; error?: string }>;
    set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    update: (updates: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  };
  shell: {
    openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  };
}

export interface ModelConfig {
  id: number;
  model_id: string;
  model_name: string;
  model_description: string;
  model_type: 't2i' | 'i2i' | 'both';
  size_control_type: 'aspect_ratio' | 'width_height' | 'fixed_sizes' | 'none';
  supported_aspect_ratios: string[] | null;
  default_aspect_ratio: string | null;
  min_width: number | null;
  max_width: number | null;
  min_height: number | null;
  max_height: number | null;
  size_step: number | null;
  fixed_sizes: string[] | null;
  default_size: string | null;
  supports_negative_prompt: boolean;
  supports_multi_images: boolean;
  max_input_images: number;
  supports_batch_generation: boolean;
  max_batch_count: number;
  notes: string | null;
}

export interface GenerateParams {
  prompt: string;
  model: string;
  aspect_ratio?: string;
  width?: number;
  height?: number;
  negative_prompt?: string;
  image?: string;
  output_format?: string;
  n?: number;
}

export interface HistoryItem {
  id: number;
  prompt: string;
  model: string;
  params: string;
  result_urls: string;
  status: 'success' | 'failed';
  error_message?: string;
  created_at: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
