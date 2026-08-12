# Wrangler 命令速查表

## ⚠️ 重要：Wrangler v4 命令格式变化

**旧版本（v3 及以下）**：使用冒号 `:`
**新版本（v4 及以上）**：使用空格

---

## 🔑 认证相关

```bash
# 登录 Cloudflare
wrangler login

# 查看当前用户
wrangler whoami

# 登出
wrangler logout
```

---

## 🗂️ KV 命名空间管理

### 创建 KV 命名空间
```bash
# ✅ 正确（v4）
wrangler kv namespace create "RATES_CACHE"

# ❌ 错误（旧格式）
wrangler kv:namespace create "RATES_CACHE"
```

### 列出所有 KV 命名空间
```bash
# ✅ 正确（v4）
wrangler kv namespace list

# ❌ 错误（旧格式）
wrangler kv:namespace list
```

### 删除 KV 命名空间
```bash
wrangler kv namespace delete --namespace-id=YOUR_ID
```

### KV 键值操作
```bash
# 列出所有键
wrangler kv key list --namespace-id=YOUR_ID

# 获取值
wrangler kv key get "my-key" --namespace-id=YOUR_ID

# 设置值
wrangler kv key put "my-key" "my-value" --namespace-id=YOUR_ID

# 删除键
wrangler kv key delete "my-key" --namespace-id=YOUR_ID
```

---

## ⚡ Cloudflare Pages 命令

### 本地开发
```bash
# 启动本地开发服务器
wrangler pages dev public

# 或使用 npm 脚本
npm run dev
```

### 部署
```bash
# 部署到 Pages
wrangler pages deploy public --project-name=vps-remaining-value

# 或使用 npm 脚本
npm run deploy
```

### 查看部署列表
```bash
wrangler pages deployment list --project-name=vps-remaining-value
```

### 查看实时日志
```bash
wrangler pages deployment tail
```

---

## 🔐 环境变量和密钥

### 设置密钥（加密存储）
```bash
# 为 Pages 项目设置密钥
wrangler pages secret put V6_API_KEY --project-name=vps-remaining-value

# 为 Worker 设置密钥
wrangler secret put V6_API_KEY
```

### 列出密钥
```bash
wrangler pages secret list --project-name=vps-remaining-value
```

---

## 📊 监控和调试

### 查看日志
```bash
# Pages 实时日志
wrangler pages deployment tail

# Worker 日志
wrangler tail
```

### 查看部署详情
```bash
wrangler pages deployment list
```

---

## 🛠️ 项目管理

### 初始化项目
```bash
wrangler init my-project
```

### 查看配置
```bash
wrangler pages project list
```

---

## 📋 本项目常用命令

### 完整部署流程
```bash
# 1. 登录
wrangler login

# 2. 创建 KV（只需一次）
wrangler kv namespace create "RATES_CACHE"
# 记录返回的 ID，更新 wrangler.toml

# 3. 本地测试
npm run dev

# 4. 部署到生产
npm run deploy

# 5. 查看日志
wrangler pages deployment tail
```

### 日常更新
```bash
# 修改代码后
git add .
git commit -m "更新说明"
npm run deploy
```

---

## 🔍 故障排查

### 检查 Wrangler 版本
```bash
wrangler --version
# 应该显示 v4.x.x
```

### 更新 Wrangler
```bash
npm update -g wrangler
```

### 查看详细错误
```bash
# 使用 --verbose 标志
wrangler deploy --verbose
```

---

## 📚 参考资料

- [Wrangler 官方文档](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [KV 文档](https://developers.cloudflare.com/kv/)

---

## 💡 提示

1. **命令格式**：Wrangler v4 使用空格，不是冒号
2. **KV ID**：创建后必须填入 `wrangler.toml`
3. **环境变量**：敏感信息用 `secret put`，公开信息用 `vars` 配置
4. **本地测试**：务必先 `npm run dev` 测试，再部署
5. **日志查看**：部署后用 `wrangler pages deployment tail` 查看实时日志
