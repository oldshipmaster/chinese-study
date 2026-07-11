# 字里少年宫 GitHub Pages 发布设计

## 目标

将现有“字里少年宫”课程站点发布到公开 GitHub 仓库 `oldshipmaster/chinese-study`，生产地址固定为 `https://oldshipmaster.github.io/chinese-study/`。

## 架构

- 保留现有 React 课程界面、HTML/CSS 动画、闯关和 localStorage 学习进度。
- 增加独立的静态站点构建入口，不依赖 Sites、Cloudflare Worker 或服务器 API。
- 所有脚本、样式和图标使用 `/chinese-study/` 基础路径，确保 GitHub Pages 子目录访问正常。
- 使用 GitHub Actions 官方 Pages 工作流：推送 `main` 后自动安装依赖、构建静态资源、上传 Pages artifact 并部署。
- 保留现有 vinext 构建和测试，新增静态输出验证；两种构建互不覆盖。

## 仓库与发布

- 创建公开仓库 `oldshipmaster/chinese-study`，默认分支为 `main`。
- 当前完整 Git 历史推送到该仓库。
- Pages Source 使用 GitHub Actions。
- 工作流需要 `pages: write` 与 `id-token: write` 权限，并使用官方 `configure-pages`、`upload-pages-artifact`、`deploy-pages` actions。

## 静态站点实现

- 使用 Vite 的 React 客户端构建作为 Pages 产物，复用 `app/components`、`app/data`、`app/lib` 和 `app/globals.css`。
- 增加轻量客户端入口与 `index.html`，避免依赖 Next/Vinext 的服务端渲染入口。
- 构建目录固定为 `pages-dist`，资源基础路径固定为 `/chinese-study/`。
- 增加 `.nojekyll`，避免 GitHub Pages 对资源目录进行 Jekyll 处理。
- 浏览器直接访问或刷新根地址均能加载站点；站内页面仍由现有客户端状态切换，不产生需要服务器回退的路径。

## 验收

- `npm test` 原有 6 项测试继续通过。
- `npm run build:pages` 成功并生成 `pages-dist/index.html`、静态 JS、CSS 与 `.nojekyll`。
- 生成的 HTML 和资源引用包含 `/chinese-study/` 前缀，不包含 localhost 或 Sites URL。
- GitHub Actions Pages 部署成功。
- `https://oldshipmaster.github.io/chinese-study/` 返回 HTTP 200，并包含“字里少年宫”。
