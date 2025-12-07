This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Getting Started

### 环境变量配置

首先，复制 `.env.example` 文件为 `.env` 并配置 WalletConnect 项目 ID：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置你的 WalletConnect 项目 ID：

```
PLASMO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

> 注意：在 Plasmo 中，环境变量必须以 `PLASMO_PUBLIC_` 前缀开头才能在客户端代码中访问。

### 开发

运行开发服务器：

```bash
yarn dev
# or
npm run dev
# or
pnpm dev
```

在浏览器中加载开发构建。例如，对于 Chrome 浏览器，使用 manifest v3，加载 `build/chrome-mv3-dev` 目录。

你可以通过修改 `popup.tsx` 来编辑 popup 页面。修改后会自动更新。要添加选项页面，只需在项目根目录添加 `options.tsx` 文件，并导出一个 React 组件。同样，要添加内容脚本，添加 `content.ts` 文件。

更多指导，请访问 [Plasmo 文档](https://docs.plasmo.com/)

### MetaMask 连接说明

由于 Chrome 扩展的 popup 运行在隔离的环境中，无法直接访问页面的 `window.ethereum`。本扩展使用 `chrome.scripting` API 来注入脚本到当前标签页，从而访问 MetaMask。

**注意事项：**
- 如果当前标签页是 `chrome://` 页面（如 chrome://extensions），无法注入脚本，会显示提示信息
- 建议在普通网页（如 https://example.com）上使用扩展
- 确保已安装 MetaMask 扩展

## Making production build

运行以下命令：

```bash
yarn build
# or
npm run build
# or
pnpm build
```

这将创建生产构建，可以打包并发布到商店。

## Submit to the webstores

部署 Plasmo 扩展最简单的方法是使用内置的 [bpp](https://bpp.browser.market) GitHub action。但在使用此操作之前，请确保构建扩展并将第一个版本上传到商店以建立基本凭据。然后，只需按照 [此设置说明](https://docs.plasmo.com/framework/workflows/submit) 操作即可实现自动化提交！

curl -X POST --data '{"jsonrpc":"2.0","method":"rollup_getInfo","params":[],"id":1}' https://rpc.mantle.xyz

curl -X POST --data '{"jsonrpc":"2.0","method":"rollup_getInfo","params":[],"id":1}' https://api.zan.top/public/mantle-mainnet
