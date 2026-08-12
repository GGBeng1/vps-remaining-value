#!/bin/bash

echo "======================================"
echo "  Cloudflare Pages 部署诊断工具"
echo "======================================"
echo ""

# 从用户获取项目 URL
read -p "请输入你的 Cloudflare Pages 项目 URL (例如: https://xxx.pages.dev): " PROJECT_URL

if [ -z "$PROJECT_URL" ]; then
    echo "❌ 错误：URL 不能为空"
    exit 1
fi

echo ""
echo "🔍 开始诊断 $PROJECT_URL"
echo ""

# 1. 检查 _routes.json 是否部署
echo "1️⃣  检查 _routes.json 是否部署..."
ROUTES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROJECT_URL/_routes.json")
if [ "$ROUTES_STATUS" = "200" ]; then
    echo "   ✅ _routes.json 已部署"
    echo "   内容："
    curl -s "$PROJECT_URL/_routes.json" | jq '.' 2>/dev/null || curl -s "$PROJECT_URL/_routes.json"
else
    echo "   ❌ _routes.json 未找到 (HTTP $ROUTES_STATUS)"
    echo "   🔧 解决方案：确保 public/_routes.json 文件存在并已推送"
fi
echo ""

# 2. 测试 /api/rates 接口
echo "2️⃣  测试 /api/rates 接口..."
API_STATUS=$(curl -s -o /tmp/api_response.txt -w "%{http_code}" "$PROJECT_URL/api/rates")
echo "   HTTP 状态码: $API_STATUS"

if [ "$API_STATUS" = "200" ]; then
    echo "   ✅ API 工作正常"
    echo "   响应内容："
    cat /tmp/api_response.txt | jq '.' 2>/dev/null || cat /tmp/api_response.txt
elif [ "$API_STATUS" = "500" ]; then
    echo "   ❌ API 返回 500 错误"
    echo "   响应内容："
    cat /tmp/api_response.txt
    echo ""
    echo "   🔧 可能的原因："
    echo "      - Functions 目录没有被部署"
    echo "      - KV 绑定未配置"
    echo "      - 代码有语法错误"
elif [ "$API_STATUS" = "404" ]; then
    echo "   ❌ API 返回 404 (未找到)"
    echo "   🔧 原因：_routes.json 未生效或 functions/api/rates.js 未部署"
else
    echo "   ❌ 意外的状态码: $API_STATUS"
fi
echo ""

# 3. 检查首页是否正常
echo "3️⃣  检查首页..."
INDEX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROJECT_URL/")
if [ "$INDEX_STATUS" = "200" ]; then
    echo "   ✅ 首页正常 (HTTP $INDEX_STATUS)"
else
    echo "   ⚠️  首页状态: HTTP $INDEX_STATUS"
fi
echo ""

# 4. 测试其他 Functions
echo "4️⃣  测试 SVG Function..."
SVG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROJECT_URL/svg/test")
echo "   HTTP 状态码: $SVG_STATUS"
if [ "$SVG_STATUS" = "200" ] || [ "$SVG_STATUS" = "400" ]; then
    echo "   ✅ SVG Function 存在 (返回 $SVG_STATUS 是正常的)"
else
    echo "   ❌ SVG Function 未部署"
fi
echo ""

# 5. 检查 CORS 头
echo "5️⃣  检查 CORS 配置..."
CORS_HEADERS=$(curl -s -I "$PROJECT_URL/api/rates" | grep -i "access-control")
if [ -n "$CORS_HEADERS" ]; then
    echo "   ✅ CORS 头存在"
    echo "$CORS_HEADERS"
else
    echo "   ⚠️  未检测到 CORS 头（这可能不是问题）"
fi
echo ""

echo "======================================"
echo "  诊断总结"
echo "======================================"
echo ""

if [ "$API_STATUS" = "500" ]; then
    echo "🚨 主要问题：API 返回 500 错误"
    echo ""
    echo "📋 排查步骤："
    echo ""
    echo "1. 检查 Cloudflare Dashboard 中的构建日志："
    echo "   - 登录 https://dash.cloudflare.com"
    echo "   - Workers & Pages → 你的项目"
    echo "   - 点击最新的 Deployment"
    echo "   - 查看 Build log 和 Function routes"
    echo ""
    echo "2. 验证 Functions 是否被识别："
    echo "   - 在 Deployment 详情页应该看到 'Functions' 标签"
    echo "   - 应该列出: /api/rates, /svg/*, /vrv/*"
    echo ""
    echo "3. 检查 KV 绑定："
    echo "   - Settings → Functions → KV namespace bindings"
    echo "   - 应该有: RATES_CACHE 绑定"
    echo ""
    echo "4. 查看实时日志："
    echo "   npx wrangler pages deployment tail"
    echo ""
elif [ "$API_STATUS" = "404" ]; then
    echo "🚨 主要问题：API 路由未找到"
    echo ""
    echo "📋 解决方案："
    echo ""
    echo "1. 确认项目结构："
    echo "   vps-remaining-value/"
    echo "   ├── functions/"
    echo "   │   ├── api/"
    echo "   │   │   └── rates.js"
    echo "   │   ├── svg[[b64]].js"
    echo "   │   └── vrv[[b64]].js"
    echo "   └── public/"
    echo "       ├── _routes.json    ← 必须存在！"
    echo "       └── index.html"
    echo ""
    echo "2. 在 Cloudflare Dashboard 检查构建设置："
    echo "   Settings → Builds & deployments"
    echo "   - Build output directory: public"
    echo "   - Build command: (留空)"
    echo ""
elif [ "$API_STATUS" = "200" ]; then
    echo "✅ 所有测试通过！你的项目工作正常。"
else
    echo "⚠️  检测到异常状态，请手动检查 Cloudflare Dashboard 的部署日志。"
fi

echo ""
echo "======================================"
