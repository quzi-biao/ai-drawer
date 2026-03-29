# AI Drawer 应用图标指南

## 图标设计说明

应用图标采用了以下设计元素：

### 视觉元素
1. **渐变背景**：紫色到粉紫色渐变（#667eea → #764ba2），代表 AI 的科技感
2. **魔法画笔**：主要图标元素，象征创作和绘画
3. **AI 火花**：金色星形闪光，代表 AI 生成的魔法效果
4. **图片框架**：小型图片预览框，代表生成的图像
5. **电路图案**：背景中的淡色电路节点，象征 AI 技术
6. **绘画轨迹**：流畅的曲线，代表创作过程

### 颜色方案
- 主色：紫色系（#667eea, #8B5CF6, #A78BFA）
- 强调色：金黄色（#FCD34D, #F59E0B）
- 点缀色：粉红色（#EC4899, #F5576C）

## 使用说明

### 1. SVG 图标
主图标文件：`icon.svg` (512x512)
- 可用于网页、文档等
- 矢量格式，可无损缩放

### 2. 生成不同格式

#### macOS (.icns)
```bash
# 安装 iconutil (macOS 自带)
# 创建 iconset 文件夹
mkdir icon.iconset

# 使用在线工具或命令生成不同尺寸
# 从 icon.svg 导出以下尺寸的 PNG：
# 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
# 每个尺寸需要 @1x 和 @2x 版本

# 转换为 .icns
iconutil -c icns icon.iconset
```

#### Windows (.ico)
```bash
# 使用在线工具或 ImageMagick
convert icon.svg -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

#### Linux (.png)
```bash
# 导出不同尺寸的 PNG
# 常用尺寸：16, 24, 32, 48, 64, 128, 256, 512
```

### 3. Electron 配置

在 `package.json` 或 electron-builder 配置中设置：

```json
{
  "build": {
    "appId": "com.ai-drawer.app",
    "productName": "AI Drawer",
    "mac": {
      "icon": "resources/icon.icns"
    },
    "win": {
      "icon": "resources/icon.ico"
    },
    "linux": {
      "icon": "resources/icon.png"
    }
  }
}
```

## 在线工具推荐

- **SVG to PNG**: https://cloudconvert.com/svg-to-png
- **PNG to ICNS**: https://cloudconvert.com/png-to-icns
- **PNG to ICO**: https://www.icoconverter.com/
- **图标生成器**: https://icon.kitchen/

## 快速生成步骤

1. 打开 `icon.svg` 在浏览器或设计工具中
2. 导出为 1024x1024 的 PNG
3. 使用在线工具转换为所需格式：
   - macOS: PNG → ICNS
   - Windows: PNG → ICO
   - Linux: 保持 PNG 格式

## 注意事项

- 确保图标在小尺寸（16x16, 32x32）下仍然清晰可辨
- 测试图标在浅色和深色背景下的显示效果
- macOS 建议使用圆角矩形设计
- Windows 建议提供透明背景版本
