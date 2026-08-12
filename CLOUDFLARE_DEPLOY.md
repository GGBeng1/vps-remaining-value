# VPS Remaining Value - Cloudflare Pages 部署指南

## 项目结构

```
vps-remaining-value/
├── public/              # 静态文件（HTML/CSS/JS/图片）
├── functions/           # Cloudflare Pages Functions (API 端点)
│   ├── api/
│   │   └── rates.js    # 汇率 API
│   ├── svg[[b64]].js   # SVG 生成
│   └── vrv[[b64]].js   # 重定向
└── wrangler.toml       # Cloudflare 配置
```

## 部署步骤

### 1. 准备工作

确保你已经有：
- Cloudflare 账号
- GitHub 仓库（可选，用于自动部署）

### 2. 创建 KV 命名空间

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV 命名空间用于缓存汇率（注意：使用空格，不是冒号）
wrangler kv namespace create "RATES_CACHE"
```

记录返回的 `id`，更新 `wrangler.toml` 中的：
```toml
[[kv_namespaces]]
binding = "RATES_CACHE"
id = "你的KV命名空间ID"
```

### 3. 设置环境变量

如果你有 ExchangeRate-API 的 V6 API Key：

```bash
wrangler secret put V6_API_KEY
# 输入你的 API Key
```

如果没有 API Key，系统会使用免费的 API 和备用汇率。

### 4. 本地测试

```bash
# 本地开发服务器
wrangler pages dev public
```

访问 http://localhost:8788 测试。

### 5. 部署到 Cloudflare Pages

#### 方式 A: 通过 Wrangler CLI 部署

```bash
wrangler pages deploy public --project-name=vps-remaining-value
```

#### 方式 B: 通过 Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 "Workers & Pages"
3. 点击 "Create application" → "Pages" → "Connect to Git"
4. 选择你的 GitHub 仓库
5. 配置构建设置：
   - **Framework preset**: None
   - **Build command**: (留空)
   - **Build output directory**: `public`
6. 环境变量设置：
   - 添加 `V6_API_KEY`（可选）
7. 点击 "Save and Deploy"

### 6. 绑定 KV 命名空间

在 Cloudflare Dashboard 中：
1. 进入你的 Pages 项目
2. 设置 → Functions → KV namespace bindings
3. 添加绑定：
   - **Variable name**: `RATES_CACHE`
   - **KV namespace**: 选择之前创建的命名空间

### 7. 配置自定义域名（可选）

1. 在 Pages 项目设置中点击 "Custom domains"
2. 添加你的域名
3. 根据提示配置 DNS 记录

## 功能说明

### API 端点

- **`/api/rates`**: 获取汇率（带缓存）
- **`/svg<base64>`**: 生成 SVG 徽章
- **`/vrv<base64>`**: 分享链接重定向

### 与原项目的区别

1. **去除了身份验证**：Cloudflare Pages Functions 限制，移除了 Cookie/Token 验证
2. **使用 KV 缓存**：替代原来的内存缓存，支持边缘缓存
3. **简化部署**：不需要 Node.js 服务器，直接静态托管

### 汇率 API 流程

1. 检查 KV 缓存
2. 如果缓存未过期，直接返回
3. 如果缓存过期，依次尝试：
   - ExchangeRate.fun (免费)
   - ExchangeRate-API V6 (需要 API Key)
   - ExchangeRate-API V4 (免费)
4. 如果全部失败，使用内置备用汇率

## 常见问题

### Q: 为什么移除了身份验证？
A: Cloudflare Pages Functions 是无状态的，不支持 signed cookies。如果需要防滥用，建议使用 Cloudflare 的 Rate Limiting。

### Q: 如何更新汇率 API Key？
A: 使用 `wrangler secret put V6_API_KEY` 或在 Dashboard 的环境变量中更新。

### Q: 静态文件需要修改吗？
A: `public/` 目录下的文件无需修改，API 路径保持不变。

### Q: 如何查看日志？
A: 在 Cloudflare Dashboard → Pages 项目 → Functions → Real-time logs

## 成本

- **免费额度**：
  - 每月 100,000 次请求
  - 每天 100,000 KV 读取
  - 每天 1,000 KV 写入
- 对于个人项目完全够用

## 回滚

如果需要回退到原 Express 服务器：
1. 保留 `server.js` 和 `package.json`
2. 删除 `functions/` 目录和 `wrangler.toml`
3. 运行 `npm start`

## 参考链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Pages Functions 文档](https://developers.cloudflare.com/pages/platform/functions/)
- [KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
