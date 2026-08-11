# Cloudflare Pages 部署验证清单

## ✅ 部署前检查

- [ ] 已创建 Cloudflare 账号
- [ ] 已安装 Wrangler CLI (`npm install -g wrangler`)
- [ ] 已登录 Cloudflare (`wrangler login`)
- [ ] 已创建 KV 命名空间并更新 `wrangler.toml`
- [ ] （可选）已准备 V6_API_KEY

## 📁 文件结构验证

```bash
# 检查关键文件是否存在
ls -la public/index.html          # ✓ 前端页面
ls -la functions/api/rates.js     # ✓ 汇率 API
ls -la functions/svg[[b64]].js    # ✓ SVG 生成
ls -la functions/vrv[[b64]].js    # ✓ 重定向
ls -la wrangler.toml               # ✓ Cloudflare 配置
```

## 🧪 本地测试步骤

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器
npm run dev

# 3. 测试访问
# 打开浏览器访问 http://localhost:8788

# 4. 测试 API 端点
curl http://localhost:8788/api/rates

# 5. 测试 SVG 生成（使用示例参数）
# 访问 http://localhost:8788/?ra=100&rc=USD&pd=365&ed=2025-12-31&tc=CNY
```

## 🚀 部署步骤

```bash
# 方式 1: 使用 Wrangler CLI
npm run deploy

# 方式 2: 通过 GitHub + Cloudflare Dashboard
# 1. Push 代码到 GitHub
# 2. 在 Cloudflare Dashboard 连接仓库
# 3. 配置构建设置（见下方）
```

## ⚙️ Cloudflare Dashboard 配置

### 构建设置
- **Framework preset**: None
- **Build command**: (留空)
- **Build output directory**: `public`

### 环境变量
- `V6_API_KEY`: (可选) 你的 ExchangeRate-API V6 Key

### KV 命名空间绑定
- **Variable name**: `RATES_CACHE`
- **KV namespace**: 选择之前创建的命名空间

## ✅ 部署后验证

### 1. 基础功能测试
```bash
# 替换 your-project.pages.dev 为你的实际域名

# 测试主页
curl https://your-project.pages.dev/

# 测试汇率 API
curl https://your-project.pages.dev/api/rates

# 测试 SVG 生成
# 浏览器访问：
# https://your-project.pages.dev/?ra=100&rc=USD&pd=365&ed=2025-12-31&tc=CNY
```

### 2. 功能验证清单
- [ ] 主页正常加载
- [ ] 汇率 API 返回数据
- [ ] SVG 预览正常显示
- [ ] 复制 Markdown 功能正常
- [ ] 复制分享链接功能正常
- [ ] 下载 SVG 功能正常

### 3. 性能验证
- [ ] 全球访问速度快（CDN 生效）
- [ ] 汇率缓存工作正常
- [ ] 响应时间 < 500ms

## 🐛 常见问题排查

### 问题 1: 部署失败
```bash
# 检查 wrangler.toml 配置
cat wrangler.toml

# 检查 KV 命名空间是否正确
wrangler kv:namespace list
```

### 问题 2: 汇率 API 返回 403
- 检查 KV 命名空间是否正确绑定
- 检查 Functions 是否正确部署

### 问题 3: SVG 不显示
- 检查浏览器控制台错误
- 验证参数是否正确传递
- 检查 Functions 日志

### 问题 4: 查看日志
```bash
# 使用 Wrangler
wrangler pages deployment tail

# 或在 Cloudflare Dashboard
# Pages 项目 → Functions → Real-time logs
```

## 📊 监控与优化

### 查看统计
- Cloudflare Dashboard → Analytics
- 查看请求量、带宽、错误率

### 性能优化建议
- [ ] 启用 Cloudflare 缓存规则
- [ ] 配置自定义域名
- [ ] 设置 Rate Limiting（如需要）

## 🔄 更新部署

```bash
# 修改代码后重新部署
git add .
git commit -m "Update: 描述你的修改"
git push

# 或使用 CLI 直接部署
npm run deploy
```

## 📝 备注

- 免费额度：每月 100,000 次请求
- KV 免费额度：每天 100,000 次读取，1,000 次写入
- 如果流量超出，会有 $0.50/百万请求的费用

## 🎉 完成

部署成功后，你的应用将在以下地址可用：
- `https://your-project.pages.dev`
- 或你配置的自定义域名

---

**需要帮助？**
- [查看详细部署指南](./CLOUDFLARE_DEPLOY.md)
- [提交 Issue](https://github.com/YoungYannick/vps-remaining-value/issues)
