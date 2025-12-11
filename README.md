# AI 内容生成器 (AI Content Generator)

这是一个使用 Gemini API 自动生成内容的应用程序。用户只需输入一个标题，应用即可自动生成一篇结构完整的文章以及 2-3 张相关的 AI 插图。

## 目录结构

```
/ (root)
│
├── index.html        # 应用程序入口
├── index.tsx         # React 入口
├── App.tsx           # 主组件 (包含 ZIP 导出逻辑)
├── services/         # Gemini API 调用逻辑
├── components/       # UI 组件
├── README.md         # 项目说明文件
├── LICENSE           # 许可证
├── robots.txt        # 爬虫配置
└── sitemap.xml       # 站点地图
```

## 功能特点

1.  **自动写作**: 基于 Gemini 2.5 Flash 模型生成高质量中文文章。
2.  **AI 绘图**: 自动根据文章内容生成 2-3 张配图。
3.  **一键导出**: 支持将生成的内容（包括 HTML、图片、配置文件等）打包导出为 ZIP 文件，包含以下结构：
    *   `index.html`
    *   `README.md`
    *   `LICENSE`
    *   `robots.txt`
    *   `sitemap.xml`
    *   `vp1.png` (第一张生成图片)

## 技术栈

*   React 19
*   TypeScript
*   Tailwind CSS
*   Google Gemini API
*   JSZip (用于客户端打包下载)
