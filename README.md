# ACE Sign 行銷追蹤儀表板

完整的行銷監控和數據分析平台，支持：
- 📧 EDM 追蹤與分析
- 📱 Meta 社群平台（Facebook、Instagram）管理與分析
- 🎯 廣告投放追蹤
- 📊 實時儀表板和報告

## 技術棧

### 前端
- Next.js 14 + React 18
- TailwindCSS + shadcn/ui
- Recharts 數據可視化
- TypeScript

### 後端
- Node.js + Express
- PostgreSQL 數據庫
- Redis 快取
- TypeScript

### 第三方集成
- Meta Graph API（Facebook、Instagram）
- Google Ads API
- Mailchimp / SendGrid API
- Stripe（可選）

## 專案結構

```
hannah/
├── apps/
│   ├── web/                    # 前端儀表板
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   └── api/                    # 後端API
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── models/
│       │   └── middleware/
│       └── scripts/
├── packages/
│   ├── shared/                 # 共享代碼
│   ├── types/                  # TypeScript 類型定義
│   └── utils/                  # 工具函數
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
├── docs/                       # 文檔
├── docker-compose.yml
└── package.json
```

## 快速開始

1. 克隆倉庫
2. 安裝依賴：`npm install`
3. 配置環境變量
4. 啟動開發服務器：`npm run dev`
5. 訪問儀表板：`http://localhost:3000`

## 核心功能

### EDM 管理
- 發送記錄追蹤
- 打開率/點擊率分析
- 訂閱者管理
- A/B 測試

### Meta 社群管理
- 貼文排程和發布
- 留言和互動管理
- 粉絲分析
- 廣告效果追蹤

### 廣告追蹤
- 多渠道廣告監控
- ROI 分析
- 轉換追蹤
- 預算管理

### 報告
- 自動化週期報告
- 自定義儀表板
- 數據導出
- 趨勢分析

## 環境變量

詳見 `.env.example`

## API 文檔

詳見 `docs/API.md`
