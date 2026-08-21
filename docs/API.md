# API 文檔

ACE Sign 行銷追蹤儀表板 API 參考

## 基礎 URL

```
http://localhost:3001/api
```

## 驗證

所有受保護的端點都需要 JWT 令牌：

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## 認證端點

### 註冊

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

**回應：**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### 登入

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```

## 儀表板端點

### 獲取概覽

```http
GET /dashboard/overview
Authorization: Bearer TOKEN
```

**回應：**

```json
{
  "edm": {
    "total_campaigns": 5,
    "total_sent": 1500,
    "total_opened": 450,
    "total_clicked": 90
  },
  "meta": {
    "total_posts": 12,
    "total_likes": 850,
    "total_comments": 120,
    "total_shares": 35
  },
  "ads": {
    "active_campaigns": 3,
    "total_spend": 1500.00,
    "total_impressions": 50000,
    "total_clicks": 1200,
    "total_conversions": 45
  }
}
```

### 獲取指標

```http
GET /dashboard/metrics
Authorization: Bearer TOKEN
```

### 獲取活動日誌

```http
GET /dashboard/activities?limit=20&offset=0
Authorization: Bearer TOKEN
```

## EDM 端點

### 獲取活動列表

```http
GET /edm/campaigns?page=1&limit=20
Authorization: Bearer TOKEN
```

### 創建活動

```http
POST /edm/campaigns
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "subject": "Summer Sale",
  "content": "<html>...</html>",
  "recipient_list": ["user1@example.com", "user2@example.com"],
  "scheduled_time": "2024-09-01T10:00:00Z"
}
```

### 發送活動

```http
POST /edm/campaigns/1/send
Authorization: Bearer TOKEN
```

### 獲取活動分析

```http
GET /edm/campaigns/1/analytics?start_date=2024-08-01&end_date=2024-08-31
Authorization: Bearer TOKEN
```

### 管理訂閱者

```http
GET /edm/subscribers?page=1&limit=20
Authorization: Bearer TOKEN

POST /edm/subscribers
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "tags": ["vip", "purchased"]
}
```

## Meta 社群媒體端點

### 連接帳戶

```http
POST /meta/connect
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "account_id": "instagram_account_id",
  "access_token": "fb_access_token"
}
```

### 排程貼文

```http
POST /meta/posts/schedule
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "content": "Check out our summer collection! 🌞",
  "scheduled_time": "2024-09-01T10:00:00Z",
  "image_url": "https://example.com/image.jpg"
}
```

### 獲取貼文分析

```http
GET /meta/posts/analytics?start_date=2024-08-01&end_date=2024-08-31
Authorization: Bearer TOKEN
```

### 獲取帳戶洞察

```http
GET /meta/insights/instagram_account_id
Authorization: Bearer TOKEN
```

### 獲取粉絲統計

```http
GET /meta/followers/demographics/instagram_account_id
Authorization: Bearer TOKEN
```

## LinkedIn 端點

### 連接帳戶

```http
POST /linkedin/connect
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "access_token": "linkedin_access_token",
  "profile_id": "linkedin_profile_id"
}
```

### 排程貼文

```http
POST /linkedin/posts/schedule
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "content": "Excited to announce our new product!",
  "scheduled_time": "2024-09-01T10:00:00Z",
  "profile_id": 1
}
```

### 獲取分析

```http
GET /linkedin/posts/analytics?start_date=2024-08-01&end_date=2024-08-31
Authorization: Bearer TOKEN
```

### 發布貼文

```http
POST /linkedin/posts/1/publish
Authorization: Bearer TOKEN
```

## MailerLite 電子郵件端點

### 連接帳戶

```http
POST /mailerlite/connect
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "api_key": "your_mailerlite_api_key"
}
```

### 獲取訂閱者

```http
GET /mailerlite/subscribers?page=1&limit=20
Authorization: Bearer TOKEN
```

### 創建活動

```http
POST /mailerlite/campaigns
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "subject": "Welcome to our newsletter",
  "content": "<html>...</html>",
  "group_id": 123456,
  "scheduled_for": "2024-09-01T10:00:00Z"
}
```

### 發送活動

```http
POST /mailerlite/campaigns/123456/send
Authorization: Bearer TOKEN
```

### 獲取活動統計

```http
GET /mailerlite/campaigns/123456/stats
Authorization: Bearer TOKEN
```

## UTM 鏈接端點

### 生成 UTM 鏈接

```http
POST /utm/generate
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "base_url": "https://example.com/product",
  "utm_source": "instagram",
  "utm_medium": "social",
  "utm_campaign": "summer_sale",
  "utm_content": "post_1",
  "utm_term": "summer"
}
```

**回應：**

```json
{
  "success": true,
  "utm_link": "https://example.com/product?utm_source=instagram&utm_medium=social&utm_campaign=summer_sale&utm_content=post_1&utm_term=summer",
  "short_code": "1"
}
```

### 獲取 UTM 鏈接列表

```http
GET /utm?page=1&limit=20
Authorization: Bearer TOKEN
```

### 獲取 UTM 鏈接效果

```http
GET /utm/1/performance
Authorization: Bearer TOKEN
```

**回應：**

```json
{
  "link": {
    "id": 1,
    "utm_link": "https://...",
    "clicks": 45
  },
  "dailyClicks": [
    {
      "date": "2024-08-21",
      "clicks": 5,
      "unique_visitors": 4
    }
  ],
  "topReferrers": [
    {
      "referrer": "instagram.com",
      "count": 25
    }
  ]
}
```

### 追蹤點擊

```http
POST /utm/1/track
Content-Type: application/json

{
  "referrer": "instagram.com",
  "user_agent": "Mozilla/5.0..."
}
```

## 廣告端點

### 獲取活動列表

```http
GET /ads/campaigns?status=active
Authorization: Bearer TOKEN
```

### 創建活動

```http
POST /ads/campaigns
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Summer Campaign",
  "platform": "facebook",
  "budget": 1000,
  "start_date": "2024-09-01",
  "end_date": "2024-09-30",
  "target_audience": {
    "age_min": 18,
    "age_max": 35,
    "interests": ["fashion", "technology"]
  }
}
```

### 獲取活動效果

```http
GET /ads/campaigns/1/performance?start_date=2024-08-01&end_date=2024-08-31
Authorization: Bearer TOKEN
```

### 獲取轉換漏斗

```http
GET /ads/funnel/1
Authorization: Bearer TOKEN
```

### 獲取受眾洞察

```http
GET /ads/audience/1
Authorization: Bearer TOKEN
```

## 報告端點

### 獲取報告列表

```http
GET /reports
Authorization: Bearer TOKEN
```

### 生成月度報告

```http
POST /reports/generate/monthly
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "month": 8,
  "year": 2024
}
```

### 導出 PDF

```http
GET /reports/1/export/pdf
Authorization: Bearer TOKEN
```

### 排程報告

```http
POST /reports/schedule
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "frequency": "monthly",
  "report_type": "monthly",
  "recipient_email": "manager@example.com"
}
```

## 錯誤處理

所有錯誤都返回 JSON 格式：

```json
{
  "error": "Error message",
  "details": "Additional details if available"
}
```

### 常見狀態碼

- `200` - 成功
- `201` - 創建成功
- `400` - 請求無效
- `401` - 未授權
- `404` - 資源不存在
- `500` - 伺服器錯誤

## 速率限制

- 免費方案：每小時 1000 個請求
- 付費方案：每小時 10,000 個請求

## 分頁

列表端點支持分頁：

```
GET /api/resource?page=1&limit=20
```

**響應：**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## WebHook

### 訂閱事件

```http
POST /webhooks/subscribe
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "event": "campaign.sent",
  "url": "https://your-app.com/webhook"
}
```

### 支持的事件

- `campaign.sent` - EDM 活動已發送
- `post.published` - 貼文已發布
- `click.tracked` - UTM 點擊被追蹤

## 代碼示例

### Python

```python
import requests

BASE_URL = "http://localhost:3001/api"
token = "your_jwt_token"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 獲取儀表板概覽
response = requests.get(f"{BASE_URL}/dashboard/overview", headers=headers)
data = response.json()
print(data)
```

### JavaScript

```javascript
const BASE_URL = "http://localhost:3001/api";
const token = "your_jwt_token";

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
};

// 獲取儀表板概覽
fetch(`${BASE_URL}/dashboard/overview`, { headers })
  .then(res => res.json())
  .then(data => console.log(data));
```

### cURL

```bash
curl -X GET "http://localhost:3001/api/dashboard/overview" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```
