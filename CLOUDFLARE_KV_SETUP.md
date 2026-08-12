# Cloudflare KV 绑定配置指南

## 🚨 如果 /api/rates 返回 500 错误

这通常是因为 **KV 命名空间没有正确绑定到 Pages 项目**。

---

## 📋 问题诊断

### 症状
```
Failed to load resource: the server responded with a status of 500 ()
/api/rates
```

### 原因
- KV 命名空间已创建，但没有绑定到 Pages 项目
- `wrangler.toml` 只在使用 Wrangler 部署时生效
- 通过 Git 连接的 Pages 项目需要在 Dashboard 手动配置

---

## ✅ 解决方案

### 方法 1：通过 Cloudflare Dashboard 配置（推荐）

#### 步骤 1：创建 KV 命名空间（如果还没创建）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages**
3. 点击顶部 **KV** 标签
4. 点击 **Create namespace**
5. Namespace name: `RATES_CACHE`
6. 点击 **Add**
7. **记录生成的 Namespace ID**（类似 `27d93a2169ef4d1d805ce70255bf7212`）

#### 步骤 2：绑定 KV 到 Pages 项目

1. 在 **Workers & Pages** 页面
2. 找到你的项目 `vps-remaining-value`
3. 点击项目名称进入详情页
4. 点击 **Settings** 标签
5. 左侧菜单找到 **Functions**
6. 滚动到 **KV namespace bindings** 部分
7. 点击 **Add binding**
8. 填写：
   ```
   Variable name: RATES_CACHE
   KV namespace: 选择刚创建的 RATES_CACHE
   ```
9. 点击 **Save**

#### 步骤 3：触发重新部署

**选项 A：通过 Git 触发**
```bash
git add .
git commit -m "fix: 添加错误处理"
git push
```

**选项 B：手动重新部署**
1. Pages 项目详情页 → **Deployments** 标签
2. 找到最新部署
3. 点击右侧三个点 `...`
4. 选择 **Retry deployment**

#### 步骤 4：验证

访问：`https://your-project.pages.dev/api/rates`

应该返回：
```json
{
  "source": "ExchangeRate.fun",
  "rates": {
    "USD": 1,
    "CNY": 7.24,
    ...
  }
}
```

---

### 方法 2：使用 Wrangler CLI 部署

```bash
# 1. 确保已创建 KV
wrangler kv namespace create "RATES_CACHE"

# 2. 更新 wrangler.toml（填入实际 ID）
[[kv_namespaces]]
binding = "RATES_CACHE"
id = "YOUR_ACTUAL_KV_ID"

# 3. 使用 Wrangler 部署
npx wrangler pages deploy public --project-name=vps-remaining-value
```

---

## 🔍 验证 KV 是否正确绑定

### 方法 1：查看部署日志

```bash
npx wrangler pages deployment tail
```

### 方法 2：测试 API

```bash
# 测试汇率 API
curl https://your-project.pages.dev/api/rates

# 应该返回 JSON，而不是 500 错误
```

### 方法 3：查看 Console 日志

如果返回了数据但有错误，检查浏览器控制台：
- 打开开发者工具 (F12)
- 查看 Console 标签
- 看是否有 "KV 读取错误" 或 "KV 写入错误"

---

## 🆘 常见问题

### Q1: 我已经在 wrangler.toml 配置了 KV，为什么还是 500？

**A:** 如果你的项目是通过 **Git 连接**到 Cloudflare Pages 的，`wrangler.toml` 不会自动生效。你需要在 Dashboard 手动配置绑定。

### Q2: Variable name 必须是 RATES_CACHE 吗？

**A:** 是的，代码中使用的是 `env.RATES_CACHE`，Variable name 必须完全一致（区分大小写）。

### Q3: 可以不使用 KV 吗？

**A:** 可以！新版本的 `rates.js` 已经添加了完善的错误处理。即使 KV 不可用，也会返回备用汇率数据，不会报 500 错误。

### Q4: 如何查看 KV 中存储的数据？

```bash
# 通过 Wrangler CLI
npx wrangler kv key list --namespace-id=YOUR_KV_ID

# 查看 rates 键的值
npx wrangler kv key get "rates" --namespace-id=YOUR_KV_ID
```

或者在 Dashboard：
1. Workers & Pages → KV
2. 点击 `RATES_CACHE`
3. 查看 Key-Value 列表

### Q5: KV 写入失败会怎么样？

**A:** 不影响！API 会直接返回从外部 API 获取的汇率，只是下次请求时无法使用缓存，需要重新请求外部 API。

---

## 📊 KV 绑定状态检查清单

- [ ] KV 命名空间已创建
- [ ] Variable name 是 `RATES_CACHE`（大写，下划线）
- [ ] KV namespace 选择了正确的命名空间
- [ ] 点击了 **Save** 保存绑定
- [ ] 触发了重新部署（Git push 或手动 Retry）
- [ ] 测试 `/api/rates` 返回 200 而不是 500

---

## 🎯 快速检查命令

```bash
# 1. 检查 KV 命名空间是否存在
npx wrangler kv namespace list

# 2. 部署前测试（本地）
npx wrangler pages dev public
# 访问 http://localhost:8788/api/rates

# 3. 查看线上日志
npx wrangler pages deployment tail

# 4. 测试线上 API
curl https://your-project.pages.dev/api/rates -v
```

---

## 💡 最终解决方案

如果以上方法都无效，可以：

1. **完全移除 KV 依赖**：新版本代码已经优雅降级，即使没有 KV 也能工作
2. **使用 Cloudflare D1**：替代 KV 作为缓存存储
3. **客户端缓存**：在前端 LocalStorage 缓存汇率

当前代码已经添加了完整的错误处理，即使 KV 完全不可用，也会返回备用汇率，不会再出现 500 错误。
