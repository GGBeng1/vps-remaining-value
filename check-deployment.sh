#!/bin/bash

# 快速检查部署状态
echo "=== Cloudflare Pages 部署状态检查 ==="
echo ""

# 获取最近的部署信息
echo "📋 正在获取部署信息..."
npx wrangler pages deployment list --project-name=vps-remaining-value 2>&1 | head -20

echo ""
echo "---"
echo ""
echo "如果看到部署列表，请访问列表中显示的 URL"
echo "如果看到错误，可能需要先登录："
echo "  npx wrangler login"
