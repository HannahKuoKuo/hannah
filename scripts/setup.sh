#!/bin/bash

set -e

echo "🚀 ACE Sign 行銷追蹤儀表板 - 設置腳本"
echo ""

# 檢查是否安裝了 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安裝。請先安裝 Docker。"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安裝。請先安裝 Docker Compose。"
    exit 1
fi

echo "✅ Docker 和 Docker Compose 已安裝"
echo ""

# 複製環境文件
if [ ! -f .env ]; then
    echo "📝 複製環境配置文件..."
    cp .env.example .env
    echo "✅ .env 文件已創建"
    echo ""
    echo "⚠️  請編輯 .env 文件並填入你的 API 密鑰："
    echo "   nano .env"
    echo ""
else
    echo "✅ .env 文件已存在"
fi

echo "🐳 啟動 Docker 容器..."
docker-compose up -d

echo "⏳ 等待服務啟動..."
sleep 10

echo "🔄 運行數據庫遷移..."
docker-compose exec -T api npm run migrate

echo "✅ 數據庫遷移完成"
echo ""

echo "🎉 設置完成！"
echo ""
echo "📍 訪問地址："
echo "   📊 儀表板：http://localhost:3000"
echo "   🔌 API：http://localhost:3001"
echo ""
echo "📝 下一步："
echo "   1. 編輯 .env 並添加你的 API 密鑰"
echo "   2. 訪問儀表板並創建帳戶"
echo "   3. 連接你的社群媒體帳戶"
echo ""
echo "📚 文檔："
echo "   - 快速開始：docs/GETTING_STARTED.md"
echo "   - API 文檔：docs/API.md"
echo "   - 部署指南：docs/DEPLOYMENT.md"
echo ""

# 檢查日誌
echo "📋 檢查服務狀態..."
docker-compose ps
