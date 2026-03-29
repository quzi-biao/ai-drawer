# AI Drawer 应用图标

## 设计概念

AI Drawer 的应用图标融合了 AI 技术和艺术创作的元素：

### 🎨 核心元素
- **魔法画笔**：代表创作工具，象征用户的创意表达
- **AI 火花**：金色星形闪光，体现 AI 的魔法般生成能力
- **图片框架**：展示生成的图像成果
- **电路纹理**：背景中的神经网络图案，暗示 AI 技术
- **流畅曲线**：代表创作的流动性和自然感

### 🎨 配色方案
- **主色调**：紫色渐变（科技感、创造力）
  - `#667eea` → `#764ba2`
- **强调色**：金黄色（灵感、魔法）
  - `#FCD34D`, `#F59E0B`
- **点缀色**：粉红色（活力、艺术）
  - `#EC4899`, `#F5576C`

## 📁 文件说明

- **icon.svg** - 主图标文件（512×512，矢量格式）
- **resources/icon-guide.md** - 详细的图标使用和转换指南

## 🚀 快速使用

### 方式一：在线转换（推荐）

1. 访问 [CloudConvert](https://cloudconvert.com/) 或 [Icon Kitchen](https://icon.kitchen/)
2. 上传 `icon.svg` 文件
3. 选择目标格式：
   - macOS: `.icns`
   - Windows: `.ico`
   - Linux: `.png` (多种尺寸)

### 方式二：使用设计工具

1. 在 Figma/Sketch/Illustrator 中打开 `icon.svg`
2. 导出为 1024×1024 PNG
3. 使用专业工具转换为平台特定格式

### 方式三：命令行工具

#### macOS
```bash
# 使用 iconutil (需要先准备 iconset)
iconutil -c icns icon.iconset -o icon.icns
```

#### Windows/Linux
```bash
# 使用 ImageMagick
magick convert icon.svg -resize 256x256 icon.ico
```

## 📦 Electron 集成

将生成的图标文件放置在项目中：

```
ai-drawer/
├── resources/
│   ├── icon.icns    # macOS
│   ├── icon.ico     # Windows
│   └── icon.png     # Linux
```

在 `package.json` 中配置：

```json
{
  "build": {
    "appId": "com.ai-drawer.app",
    "productName": "AI Drawer",
    "mac": {
      "icon": "resources/icon.icns",
      "category": "public.app-category.graphics-design"
    },
    "win": {
      "icon": "resources/icon.ico",
      "target": ["nsis"]
    },
    "linux": {
      "icon": "resources/icon.png",
      "category": "Graphics"
    }
  }
}
```

## 🎯 所需尺寸

### macOS (.icns)
- 16×16, 32×32, 64×64, 128×128, 256×256, 512×512, 1024×1024
- 每个尺寸需要 @1x 和 @2x 版本

### Windows (.ico)
- 16×16, 32×32, 48×48, 64×64, 128×128, 256×256

### Linux (.png)
- 16×16, 24×24, 32×32, 48×48, 64×64, 128×128, 256×256, 512×512

## 🔧 在线工具推荐

- **SVG 转 PNG**: [CloudConvert](https://cloudconvert.com/svg-to-png)
- **PNG 转 ICNS**: [iConvert Icons](https://iconverticons.com/online/)
- **PNG 转 ICO**: [ICO Convert](https://icoconvert.com/)
- **一站式图标生成**: [Icon Kitchen](https://icon.kitchen/)

## 📝 设计规范

- ✅ 圆角矩形背景（圆角半径：115px / 512px = 22.5%）
- ✅ 在小尺寸下保持清晰可辨
- ✅ 支持浅色和深色背景
- ✅ 使用发光效果增强视觉冲击
- ✅ 保持品牌一致性

## 🎨 预览

图标在不同尺寸下的表现：
- **512×512**: 完整细节展示
- **256×256**: 主要元素清晰
- **128×128**: 核心图形可辨
- **64×64**: 简化但可识别
- **32×32**: 保留关键特征
- **16×16**: 最小化但仍可识别

## 📄 许可

此图标设计专为 AI Drawer 应用创建，可自由用于项目的各种用途。
