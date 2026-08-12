#!/bin/bash

echo "======================================"
echo "  详细调试部署脚本"
echo "======================================"
echo ""

# 检查项目结构
echo "1️⃣  检查项目结构..."
echo ""
echo "📁 public/ 目录："
ls -lh public/*.html public/*.json 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "📁 functions/ 目录："
find functions -name "*.js" -type f | while read f; do
    size=$(ls -lh "$f" | awk '{print $5}')
    echo "  $f ($size)"
done
echo ""

# 检查 _routes.json
echo "2️⃣  检查 _routes.json..."
if [ -f "public/_routes.json" ]; then
    echo "✅ _routes.json 存在"
    cat public/_routes.json | jq . 2>/dev/null || cat public/_routes.json
else
    echo "❌ 错误：public/_routes.json 不存在！"
    exit 1
fi
echo ""

# 检查 wrangler.toml
echo "3️⃣  检查 wrangler.toml..."
if [ -f "wrangler.toml" ]; then
    echo "✅ wrangler.toml 存在"
    echo "配置内容："
    cat wrangler.toml
else
    echo "❌ 错误：wrangler.toml 不存在！"
    exit 1
fi
echo ""

# 开始部署
echo "4️⃣  开始部署..."
echo ""
echo "运行命令："
echo "  npx wrangler pages deploy . --project-name=vps-remaining-value"
echo ""
read -p "确认部署? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 1
fi

echo ""
echo "🚀 部署中（请仔细查看输出）..."
echo ""
echo "⚠️  特别注意以下信息："
echo "  - 是否有 'Uploading Functions' 字样"
echo "  - 上传了多少个 function"
echo "  - KV 绑定是否有警告"
echo ""
echo "---"
echo ""

# 部署并保存输出
npx wrangler pages deploy . --project-name=vps-remaining-value 2>&1 | tee /tmp/wrangler-deploy.log

DEPLOY_STATUS=${PIPESTATUS[0]}

echo ""
echo "---"
echo ""

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "✅ 部署命令执行完成"
    echo ""
    echo "5️⃣  检查部署输出中的关键信息："
    echo ""

    if grep -q "Uploading Functions" /tmp/wrangler-deploy.log; then
        echo "✅ 发现 'Uploading Functions' - Functions 已上传"
        echo ""
        echo "上传的 Functions："
        grep -A 20 "Uploading Functions" /tmp/wrangler-deploy.log | grep -E "functions/|✨"
    else
        echo "❌ 警告：没有看到 'Uploading Functions' 字样"
        echo "   这意味着 functions/ 目录可能没有被上传！"
    fi

    echo ""
    echo "部署 URL："
    grep -E "https://.*pages\.dev" /tmp/wrangler-deploy.log | tail -1

    echo ""
    echo "6️⃣  下一步测试："
    echo ""
    echo "访问以下 URL 进行测试："
    echo "  https://你的项目.pages.dev/test.html"
    echo "  https://你的项目.pages.dev/api/test"
    echo ""
else
    echo "❌ 部署失败"
    echo ""
    echo "错误日志已保存到: /tmp/wrangler-deploy.log"
    exit 1
fi

echo ""
echo "完整输出日志: /tmp/wrangler-deploy.log"
