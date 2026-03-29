import { X, CheckCircle2, ExternalLink } from 'lucide-react';

interface GuideDialogProps {
  onClose: () => void;
}

export default function GuideDialog({ onClose }: GuideDialogProps) {
  const handleOpenExternal = async (url: string) => {
    if (window.electronAPI?.shell) {
      await window.electronAPI.shell.openExternal(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">操作引导</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 快速开始 */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">1</span>
              快速开始
            </h3>
            
            <div className="space-y-4 ml-10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">点击右上角的「配置」按钮</p>
                  <p className="text-sm text-gray-600 mt-1">打开配置对话框，进行初始设置</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">在「设置」标签页配置云端地址</p>
                  <p className="text-sm text-gray-600 mt-1">输入云端 API 服务器地址，用于获取 API Key 和模型列表</p>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <code className="text-sm text-gray-700">例如: https://api.example.com:5443</code>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">设置图片保存目录（可选）</p>
                  <p className="text-sm text-gray-600 mt-1">选择生成图片的本地保存位置，默认为 ~/ai-pictures</p>
                </div>
              </div>
            </div>
          </section>

          {/* 获取 API Key */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">2</span>
              获取 API Key
            </h3>
            
            <div className="space-y-4 ml-10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">在「钱包管理」标签页查看钱包地址</p>
                  <p className="text-sm text-gray-600 mt-1">系统会自动生成一个唯一的钱包地址作为您的身份标识</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">将钱包地址发送给管理员</p>
                  <p className="text-sm text-gray-600 mt-1">管理员会在后台为您的地址绑定 API Key</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">在「API Key 配置」标签页点击「从云端获取」</p>
                  <p className="text-sm text-gray-600 mt-1">使用您的钱包地址从云端获取已绑定的 API Key</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>提示：</strong>如果您已有 API Key，也可以在「API Key 配置」中直接手动填写
                </p>
              </div>
            </div>
          </section>

          {/* 加载模型列表 */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">3</span>
              加载模型列表
            </h3>
            
            <div className="space-y-4 ml-10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">在「API Key 配置」标签页点击「更新模型列表」</p>
                  <p className="text-sm text-gray-600 mt-1">从云端获取当前支持的所有 AI 模型列表</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">完成后即可开始使用</p>
                  <p className="text-sm text-gray-600 mt-1">在主界面选择模型，输入描述，开始生成 AI 图片</p>
                </div>
              </div>
            </div>
          </section>

          {/* 系统说明 */}
          <section className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-bold">ℹ️</span>
              系统说明
            </h3>
            
            <div className="ml-10 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-gray-700 font-medium">•</span>
                  <p className="text-sm text-gray-700">
                    <strong>数据隐私：</strong>本系统仅从云端获取 API Key 和模型列表，所有生成的图片、历史记录等数据均存储在本地，确保您的隐私安全
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-gray-700 font-medium">•</span>
                  <p className="text-sm text-gray-700">
                    <strong>AI 服务提供商：</strong>大模型调用服务由 302.AI 提供
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-gray-700 font-medium">•</span>
                  <p className="text-sm text-gray-700">
                    <strong>开源项目：</strong>如需扩展支持更多供应商或提交问题，请访问{' '}
                    <button 
                      onClick={() => handleOpenExternal('https://github.com/quzi-biao/ai-drawer')}
                      className="text-indigo-600 hover:text-indigo-700 underline inline-flex items-center gap-1"
                    >
                      GitHub 仓库
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            开始使用
          </button>
        </div>
      </div>
    </div>
  );
}
