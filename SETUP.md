# AI Drawer 安装和部署指南

## 快速开始

### 1. 克隆或创建项目

项目已创建在：`/Users/zhengbiaoxie/Workspace/ai-business/ai-drawer`

### 2. 安装依赖

```bash
cd /Users/zhengbiaoxie/Workspace/ai-business/ai-drawer
pnpm install
```

如果没有 pnpm，先安装：
```bash
npm install -g pnpm
```

### 3. 配置云端 API

创建 `.env.local` 文件（可选）：

```bash
# 云端 API 地址
CLOUD_API_URL=http://localhost:3003
```

### 4. 启动开发服务器

```bash
pnpm dev
```

这将：
1. 启动 Vite 开发服务器（端口 5173）
2. 启动 Electron 应用
3. 自动打开 DevTools

## 云端 API 配置

### 确保云端服务已启动

AI Drawer 依赖以下云端接口：

1. **API Key 获取接口**
   - 路径: `/api/public/get-apikey/`
   - 已在 dev_panel 项目中实现

2. **模型列表接口**
   - 路径: `/api/business/image-models`
   - 需要在 dev_panel 项目中实现

3. **图片生成接口**
   - 路径: `/api/images/generate`
   - 已在 dev_panel 项目中实现

### 启动云端服务

```bash
cd /Users/zhengbiaoxie/Workspace/water/dev_panel
npm run dev  # 或 pnpm dev
```

确保服务运行在端口 3003。

## 首次运行配置

### 1. 应用启动

首次启动时，应用会：
- 自动生成以太坊钱包
- 创建 SQLite 数据库
- 显示配置提示

### 2. 配置 API Key

有两种方式：

#### 方式 A：从云端获取（推荐）

1. 在云端数据库中添加测试账户：
```bash
cd /Users/zhengbiaoxie/Workspace/water/dev_panel
npx tsx scripts/add-test-apikey.ts
```

2. 在 AI Drawer 中：
   - 点击"配置"按钮
   - 复制显示的钱包地址
   - 联系管理员将该地址绑定到云端
   - 点击"从云端获取"

#### 方式 B：手动填写

1. 获取一个有效的 API Key
2. 在 AI Drawer 中点击"配置"
3. 在"手动填写"区域输入 API Key
4. 点击"保存"

### 3. 更新模型列表

在配置对话框中点击"更新模型列表"，从云端获取最新的模型配置。

## 打包部署

### macOS

```bash
# 构建
pnpm build
pnpm build:electron

# 输出
dist-electron/mac/AI Drawer.app
dist-electron/AI Drawer-1.0.0.dmg
```

### Windows

```bash
pnpm build
pnpm build:electron

# 输出
dist-electron/win-unpacked/
dist-electron/AI Drawer Setup 1.0.0.exe
```

### Linux

```bash
pnpm build
pnpm build:electron

# 输出
dist-electron/AI Drawer-1.0.0.AppImage
dist-electron/ai-drawer_1.0.0_amd64.deb
```

## 数据存储位置

### macOS
- 数据库: `~/Library/Application Support/ai-drawer/ai-drawer.db`
- 钱包: `~/Library/Application Support/ai-drawer/wallet.json`

### Windows
- 数据库: `%APPDATA%/ai-drawer/ai-drawer.db`
- 钱包: `%APPDATA%/ai-drawer/wallet.json`

### Linux
- 数据库: `~/.config/ai-drawer/ai-drawer.db`
- 钱包: `~/.config/ai-drawer/wallet.json`

## 开发调试

### 查看日志

**主进程日志**（终端）:
```bash
# 启动时会显示
Wallet loaded: 0x...
Database initialized
```

**渲染进程日志**（DevTools Console）:
```javascript
// 在 React 组件中
console.log('API result:', result);
```

### 重置应用数据

删除数据目录：
```bash
# macOS
rm -rf ~/Library/Application\ Support/ai-drawer

# Linux
rm -rf ~/.config/ai-drawer

# Windows (PowerShell)
Remove-Item -Recurse -Force $env:APPDATA\ai-drawer
```

### 调试 IPC 通信

在 `electron/main.js` 中添加日志：
```javascript
ipcMain.handle('apikey:get', async () => {
  console.log('IPC: apikey:get called');
  // ...
});
```

## 常见问题

### Q: 应用启动后白屏
A: 检查：
1. Vite 开发服务器是否正常启动（端口 5173）
2. 查看终端是否有错误信息
3. 打开 DevTools 查看控制台错误

### Q: 无法从云端获取 API Key
A: 检查：
1. 云端服务是否运行（端口 3003）
2. 钱包地址是否已在云端注册
3. 网络连接是否正常
4. 查看 DevTools Network 标签页的请求详情

### Q: 图片生成失败
A: 检查：
1. API Key 是否有效
2. 模型列表是否已更新
3. 云端图片生成接口是否正常
4. 查看错误信息

### Q: 数据库错误
A: 尝试：
1. 删除数据库文件重新初始化
2. 检查文件权限
3. 查看终端错误日志

## 性能优化

### 生产环境构建

```bash
# 设置环境变量
export NODE_ENV=production

# 构建
pnpm build
pnpm build:electron
```

### 减小包体积

1. 移除未使用的依赖
2. 使用 `electron-builder` 的压缩选项
3. 排除开发依赖

## 安全建议

1. **不要提交敏感文件**
   - `wallet.json`
   - `*.db`
   - `.env.local`

2. **定期备份**
   - 导出钱包私钥
   - 备份数据库文件

3. **更新依赖**
```bash
pnpm update
```

## 下一步

1. 完善图片生成功能
2. 添加历史记录管理
3. 实现图片编辑功能
4. 开发 React Native 移动端
5. 添加更多 AI 模型支持

## 技术支持

遇到问题？
1. 查看 README.md
2. 检查 GitHub Issues
3. 联系开发团队
