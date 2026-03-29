# AI Drawer

一个基于 Electron 和 React 的独立 AI 画图应用，支持本地存储、加密通信和跨平台部署。

## 功能特性

### 核心功能
- 🎨 **AI 图片生成** - 支持多种 AI 模型的文生图功能
- 🔐 **安全加密** - 使用以太坊钱包进行身份验证，API Key 加密存储
- 💾 **本地存储** - 使用 SQLite 数据库本地存储历史记录和配置
- ☁️ **云端集成** - 支持从云端获取 API Key 和模型列表
- 🖥️ **跨平台** - 支持 Windows、macOS 和 Linux

### 安全特性
- 本地生成以太坊钱包（公钥/私钥对）
- 公钥作为唯一标识，用于从云端获取 API Key
- API Key 使用 RSA 混合加密传输
- 私钥本地存储，可导出备份
- API Key 保存后不可查看（仅显示配置状态）

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Electron
- **构建工具**: Vite
- **样式**: TailwindCSS
- **数据库**: SQLite (better-sqlite3)
- **加密**: ethers.js (以太坊钱包)
- **图标**: Lucide React

## 项目结构

```
ai-drawer/
├── electron/              # Electron 主进程
│   ├── main.js           # 主进程入口
│   ├── preload.js        # 预加载脚本
│   ├── database.js       # SQLite 数据库
│   ├── wallet.js         # 钱包管理
│   └── api-client.js     # API 客户端
├── src/                  # React 前端
│   ├── components/       # 组件
│   │   ├── ConfigDialog.tsx    # 配置对话框
│   │   └── ImageGenerator.tsx  # 图片生成器
│   ├── App.tsx          # 主应用
│   ├── main.tsx         # 入口文件
│   ├── types.ts         # 类型定义
│   └── index.css        # 样式
├── package.json         # 依赖配置
├── vite.config.ts       # Vite 配置
└── tsconfig.json        # TypeScript 配置
```

## 安装和运行

### 1. 安装依赖

```bash
cd /Users/zhengbiaoxie/Workspace/ai-business/ai-drawer
pnpm install
```

### 2. 开发模式

```bash
pnpm dev
```

这将同时启动 Vite 开发服务器和 Electron 应用。

### 3. 构建应用

```bash
# 构建前端
pnpm build

# 打包 Electron 应用
pnpm build:electron
```

打包后的应用将在 `dist-electron` 目录中。

## 使用说明

### 首次使用

1. **启动应用** - 应用会自动生成一个以太坊钱包
2. **配置 API Key** - 点击右上角的"配置"按钮
3. **选择获取方式**:
   - **从云端获取**: 使用钱包地址从云端获取（需要管理员预先配置）
   - **手动填写**: 直接输入已有的 API Key

### 配置 API Key

#### 方式一：从云端获取
1. 点击"配置" → "API Key 配置"
2. 点击"从云端获取"
3. 应用会使用你的钱包地址向云端请求 API Key
4. API Key 会被加密传输并保存到本地数据库

#### 方式二：手动填写
1. 点击"配置" → "API Key 配置"
2. 在"手动填写"区域输入 API Key
3. 点击"保存"

### 钱包管理

#### 查看钱包地址
- 在配置对话框的"钱包管理"标签页查看
- 钱包地址是你的唯一标识

#### 导出私钥
1. 点击"显示私钥"
2. **⚠️ 请妥善保管私钥，不要泄露给他人**

#### 重新生成钱包
1. 点击"重新生成钱包"
2. **⚠️ 这将清空当前钱包，需要联系管理员重新绑定地址**

### 生成图片

1. 在左侧面板选择模型
2. 输入提示词（描述你想要生成的图片）
3. 点击"生成图片"
4. 生成的图片将显示在右侧

## 云端 API 接口

应用需要以下云端接口支持：

### 1. 获取 API Key
- **接口**: `POST /api/public/get-apikey/`
- **功能**: 根据钱包地址获取加密的 API Key
- **认证**: 以太坊签名验证

### 2. 获取模型列表
- **接口**: `GET /api/business/image-models`
- **功能**: 获取支持的 AI 模型列表及参数

### 3. 生成图片
- **接口**: `POST /api/images/generate`
- **功能**: 调用 AI 模型生成图片
- **认证**: Bearer Token (API Key)

## 数据库结构

### api_keys 表
存储 API Key 配置

```sql
CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY,
  api_key TEXT NOT NULL,
  source TEXT NOT NULL,  -- 'cloud' 或 'manual'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### models 表
缓存模型列表

```sql
CREATE TABLE models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  model_data TEXT NOT NULL,  -- JSON 格式
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### generation_history 表
存储生成历史

```sql
CREATE TABLE generation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  params TEXT,           -- JSON 格式
  result_urls TEXT,      -- JSON 格式
  status TEXT NOT NULL,  -- 'success' 或 'failed'
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 安全说明

### 密钥管理
- **钱包文件**: 存储在 `userData/wallet.json`
- **数据库**: 存储在 `userData/ai-drawer.db`
- **私钥**: 仅本地存储，不会上传到云端
- **API Key**: 加密传输，本地明文存储（仅应用可访问）

### 建议
1. 定期备份钱包私钥
2. 不要在不安全的网络环境下使用
3. 如果私钥泄露，立即重新生成钱包并联系管理员

## 环境变量

可以通过环境变量配置云端 API 地址：

```bash
CLOUD_API_URL=http://your-api-server.com
```

默认值: `http://localhost:3003`

## 故障排除

### 无法连接到云端
- 检查网络连接
- 确认云端 API 地址配置正确
- 查看开发者工具的控制台日志

### API Key 获取失败
- 确认钱包地址已在云端注册
- 联系管理员检查配置
- 尝试手动填写 API Key

### 图片生成失败
- 检查 API Key 是否有效
- 确认模型列表已更新
- 查看错误信息

## 开发说明

### 添加新功能
1. 在 `electron/main.js` 中添加 IPC 处理器
2. 在 `electron/preload.js` 中暴露 API
3. 在 `src/types.ts` 中添加类型定义
4. 在 React 组件中调用 `window.electronAPI`

### 调试
- 开发模式下会自动打开 DevTools
- 主进程日志在终端查看
- 渲染进程日志在 DevTools 控制台查看

## 未来计划

- [ ] 添加图片编辑功能（裁剪、去背景等）
- [ ] 支持批量生成
- [x] 添加历史记录管理
- [x] 支持更多 AI 模型
- [ ] React Native 移动端支持
- [ ] 图片导出和分享功能

## License

MIT

## 联系方式

如有问题或建议，请联系开发团队。
