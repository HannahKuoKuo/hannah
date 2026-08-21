# ACE Sign Analytics - 本地開發指南

## 📋 前置要求

- Node.js 18+ 和 npm/yarn
- Docker & Docker Compose (可選)
- Git

## 🚀 快速開始

### 1. 克隆並進入項目

```bash
cd acesign-analytics
```

### 2. 後端設置

```bash
cd backend

# 安裝依賴
npm install

# 創建 .env 文件
cat > .env << 'EOF'
NODE_ENV=development
API_PORT=3001
API_HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=acesign_analytics
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# API Keys (使用 Mock 數據)
MAILERLITE_API_KEY=mock_key
META_ACCESS_TOKEN=mock_token
LINKEDIN_ACCESS_TOKEN=mock_token
GOOGLE_ANALYTICS_KEY=mock_key
EOF

# 啟動後端服務
npm run dev
# 後端運行在 http://localhost:3001
```

### 3. 前端設置

在新終端窗口中：

```bash
cd frontend

# 安裝依賴
npm install

# 創建 .env.local 文件
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF

# 啟動前端開發服務器
npm run dev
# 前端運行在 http://localhost:3000
```

### 4. 訪問應用

打開瀏覽器，訪問 `http://localhost:3000`

## 🔐 測試認證

### 默認用戶

使用以下認證信息登錄：

```
郵箱: demo@acesign.com
密碼: Demo123!@#
```

或自行註冊新帳戶。

## 🧪 功能測試清單

### 多渠道集成
- [ ] MailerLite 數據加載
- [ ] Meta/Instagram 帖子展示
- [ ] LinkedIn 分析
- [ ] GA4 指標

### 分析功能
- [ ] UTM 鏈接生成和追踪
- [ ] 歸因分析（5 個模型）
- [ ] A/B 測試統計計算
- [ ] CLV 和隊列分析
- [ ] KPI 儀表板

### 開發工具
- [ ] SQL 查詢編輯器
- [ ] Python 腳本執行
- [ ] 查詢歷史記錄

### 內容管理
- [ ] 內容日曆發佈
- [ ] 報告生成
- [ ] 報告模板

### 管理功能
- [ ] 團隊成員管理
- [ ] 角色分配
- [ ] 權限控制

## 🛠️ 常用命令

### 後端

```bash
cd backend

# 開發模式
npm run dev

# 構建
npm run build

# 生產模式
npm start

# 運行測試
npm test

# 檢查代碼質量
npm run lint
```

### 前端

```bash
cd frontend

# 開發模式
npm run dev

# 構建
npm run build

# 生產預覽
npm run start

# 類型檢查
npm run type-check

# 檢查代碼質量
npm run lint
```

## 📁 項目結構

```
acesign-analytics/
├── backend/                 # Express API 服務器
│   ├── src/
│   │   ├── routes/         # API 路由（17 個）
│   │   ├── middleware/     # 中間件（認證、錯誤處理、速率限制）
│   │   ├── utils/          # 工具函數
│   │   └── index.ts        # 主應用程序
│   └── Dockerfile
│
├── frontend/               # Next.js 前端應用
│   ├── src/
│   │   ├── app/           # 應用頁面
│   │   │   └── dashboard/ # Dashboard 頁面（14 個）
│   │   ├── components/    # React 組件
│   │   ├── lib/           # 工具庫（API 客戶端、緩存）
│   │   ├── hooks/         # React Hooks
│   │   └── store/         # Zustand 狀態管理
│   └── Dockerfile
│
└── docker-compose.yml     # 容器編排
```

## 🐳 Docker 設置（可選）

### 使用 Docker Compose 啟動完整堆棧

```bash
# 構建和啟動所有服務
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

## 🔧 環境變量配置

### 後端 (.env)

```env
NODE_ENV=development
API_PORT=3001
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=dev-secret-key
```

### 前端 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📊 API 文檔

### 主要端點

| 類別 | 路由 | 描述 |
|------|------|------|
| Auth | `POST /api/auth/login` | 用戶登錄 |
| Analytics | `GET /api/attribution/analysis` | 歸因分析 |
| A/B Test | `GET /api/abtest` | 獲取 A/B 測試 |
| CLV | `GET /api/clv/analysis` | CLV 分析 |
| KPI | `GET /api/kpi` | 獲取 KPI |
| Query | `POST /api/query/execute` | 執行 SQL |
| Python | `POST /api/python` | 創建 Python 腳本 |

## 🐛 故障排除

### 後端連接失敗

```bash
# 檢查後端是否運行
curl http://localhost:3001/health

# 查看後端日誌
npm run dev
```

### 前端無法連接到後端

1. 確認 `.env.local` 中的 `NEXT_PUBLIC_API_URL`
2. 檢查後端是否正在運行
3. 檢查 CORS 配置

### 數據庫連接問題

```bash
# PostgreSQL 不運行時使用 Mock 數據
# 應用自動使用 Mock 數據進行開發
```

## 💡 開發提示

1. **使用 Mock 數據** - 所有 API 端點都返回 Mock 數據以便開發
2. **自動刷新** - 前端啟用了 HMR，文件更改會自動重載
3. **類型檢查** - 確保運行 `npm run type-check` 以捕捉類型錯誤
4. **API 緩存** - 前端自動緩存 API 響應以提高性能

## 📚 進一步閱讀

- [Next.js 文檔](https://nextjs.org/docs)
- [Express.js 文檔](https://expressjs.com/)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Recharts 文檔](https://recharts.org/)

## 🤝 貢獻

1. 創建功能分支 (`git checkout -b feature/amazing-feature`)
2. 提交更改 (`git commit -m 'Add amazing feature'`)
3. 推送到分支 (`git push origin feature/amazing-feature`)
4. 打開 Pull Request

## 📝 許可證

MIT License - 詳見 LICENSE 文件
