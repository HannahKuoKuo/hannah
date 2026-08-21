# 部署指南

ACE Sign 行銷追蹤儀表板部署指南

## 前置需求

- Docker 和 Docker Compose
- Node.js 18+（本地開發）
- PostgreSQL 13+（本地開發）
- Redis 6+（本地開發）

## 本地開發設置

### 1. 環境配置

複製環境變量文件：

```bash
cp .env.example .env
```

編輯 `.env` 文件，填入你的 API 密鑰：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ace_sign_marketing
REDIS_URL=redis://localhost:6379

# Meta Graph API
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_ACCESS_TOKEN=your-access-token

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=your-token
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-secret

# MailerLite
MAILCHIMP_API_KEY=your-key
MAILCHIMP_DATACENTER=us1

# JWT
JWT_SECRET=your-secret-key-generate-a-strong-one
```

### 2. 啟動開發伺服器

```bash
# 使用 Docker Compose
docker-compose up -d

# 或本地開發
npm install
npm run dev
```

### 3. 運行數據庫遷移

```bash
npm run db:migrate
npm run db:seed
```

### 4. 訪問應用

- 前端：http://localhost:3000
- API：http://localhost:3001
- API 文檔：http://localhost:3001/docs

## 生產部署

### 方式 1：Docker Compose（推薦用於小型部署）

```bash
# 1. 準備環境
cp .env.example .env.production
# 編輯 .env.production

# 2. 構建並啟動
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 運行遷移
docker-compose exec api npm run migrate

# 4. 查看日誌
docker-compose logs -f
```

### 方式 2：Kubernetes（推薦用於大型部署）

```bash
# 應用 Kubernetes 配置
kubectl apply -f k8s/

# 查看狀態
kubectl get pods
kubectl logs deployment/ace-sign-api
```

### 方式 3：雲平台部署

#### Heroku

```bash
# 1. 登入 Heroku
heroku login

# 2. 創建應用
heroku create ace-sign-marketing

# 3. 設置數據庫
heroku addons:create heroku-postgresql:standard-0

# 4. 設置環境變量
heroku config:set JWT_SECRET=your-secret
heroku config:set META_APP_ID=your-id
# ... 設置其他環境變量

# 5. 部署
git push heroku main

# 6. 運行遷移
heroku run npm run migrate
```

#### AWS EC2

```bash
# 1. SSH 連接到實例
ssh -i your-key.pem ubuntu@your-instance-ip

# 2. 安裝依賴
sudo apt-get update
sudo apt-get install -y docker.io docker-compose nodejs npm

# 3. 克隆倉庫
git clone <your-repo>
cd hannah

# 4. 配置環境
cp .env.example .env
# 編輯 .env

# 5. 啟動
docker-compose up -d
```

#### DigitalOcean App Platform

```bash
# 1. 連接 GitHub 倉庫
# - 在 DigitalOcean 儀表板創建新 App
# - 連接 GitHub 帳戶
# - 選擇倉庫

# 2. 配置應用
# - 設置環境變量
# - 配置構建和運行命令

# 3. 部署
# DigitalOcean 會自動部署每次 push
```

## 配置指南

### 1. Meta Graph API 配置

```bash
# 1. 訪問 https://developers.facebook.com/
# 2. 創建應用
# 3. 添加 Facebook Login 和 Instagram Graph API 產品
# 4. 生成存取令牌
# 5. 複製 APP_ID, APP_SECRET, ACCESS_TOKEN 到 .env
```

### 2. Google Ads 配置

```bash
# 1. 訪問 https://ads.google.com/
# 2. 啟用 Google Ads API
# 3. 創建 OAuth 2.0 憑證
# 4. 複製客戶端 ID 和密鑰
# 5. 獲取開發者令牌
```

### 3. MailerLite 配置

```bash
# 1. 訪問 https://mailerlite.com/
# 2. 登入帳戶
# 3. 轉到設置 > API
# 4. 複製 API 密鑰
```

### 4. LinkedIn 配置

```bash
# 1. 訪問 https://www.linkedin.com/developers/
# 2. 創建應用
# 3. 請求存取 Share on LinkedIn 權限
# 4. 生成存取令牌
```

## 監控和維護

### 日誌

```bash
# Docker Compose
docker-compose logs -f api
docker-compose logs -f web

# Kubernetes
kubectl logs deployment/ace-sign-api -f
```

### 備份數據庫

```bash
# Docker Compose
docker-compose exec postgres pg_dump -U postgres ace_sign_marketing > backup.sql

# 恢復
docker-compose exec -T postgres psql -U postgres ace_sign_marketing < backup.sql
```

### 更新應用

```bash
# 1. 拉取最新代碼
git pull origin main

# 2. 重新構建
docker-compose build

# 3. 運行遷移
docker-compose exec api npm run migrate

# 4. 重啟
docker-compose up -d
```

## 故障排除

### 常見問題

#### 1. 數據庫連接失敗

```bash
# 檢查 PostgreSQL 狀態
docker-compose ps postgres

# 檢查日誌
docker-compose logs postgres

# 重新啟動
docker-compose restart postgres
```

#### 2. Redis 連接失敗

```bash
# 檢查 Redis 狀態
docker-compose ps redis

# 清除緩存
docker-compose exec redis redis-cli FLUSHALL
```

#### 3. API 啟動失敗

```bash
# 檢查日誌
docker-compose logs api

# 驗證環境變量
docker-compose exec api env | grep DATABASE_URL

# 手動運行遷移
docker-compose exec api npm run migrate
```

## 性能優化

### 1. 啟用 Redis 快取

已在應用中默認啟用。確保 REDIS_URL 正確配置。

### 2. 數據庫索引

所有關鍵表已建立索引。如需添加更多索引：

```bash
docker-compose exec postgres psql -U postgres -d ace_sign_marketing
```

### 3. CDN 配置

配置 CloudFront 或 Cloudflare 來緩存靜態資源。

### 4. 數據庫複製

對於大型部署，設置讀複本：

```bash
# AWS RDS 主從複製
# 或 PostgreSQL 內置流複製
```

## 安全性

### 1. SSL/TLS 配置

使用 Let's Encrypt：

```bash
# Certbot
certbot certonly --standalone -d your-domain.com

# 複製證書
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
```

### 2. 環境變量安全

- 使用密鑰管理服務（AWS Secrets Manager, HashiCorp Vault）
- 不要在代碼中提交 .env 文件
- 定期輪換 API 密鑰

### 3. 防火牆規則

```bash
# 僅允許必要的端口
# 80 (HTTP)
# 443 (HTTPS)
# 3001 (API - 內部)
# 3000 (Web - 內部)
```

### 4. 定期備份

```bash
# 每日備份數據庫
0 2 * * * cd /path/to/hannah && docker-compose exec -T postgres pg_dump -U postgres ace_sign_marketing | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz
```

## 支援

遇到問題？

1. 檢查 [API 文檔](./API.md)
2. 查看 [故障排除指南](./TROUBLESHOOTING.md)
3. 提交 Issue 到 GitHub
