#!/bin/bash

echo "🚀 部署到 Cloudflare Pages"
echo ""
npx wrangler pages deploy public --project-name=vps-remaining-value
