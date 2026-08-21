# 系統架構

ACE Sign 行銷追蹤儀表板 - 技術架構

## 高層架構

```
┌─────────────────────────────────────────────────────────┐
│                    用戶瀏覽器                              │
│           (React/Next.js 前端應用)                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
┌─────────────────────▼────────────────────────────────────┐
│                   Nginx 反向代理                          │
│              (負載均衡與 SSL/TLS)                        │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    ┌────────────┐         ┌──────────────┐
    │  Web 應用   │         │  API 伺服器   │
    │ (Next.js)  │         │ (Express.js) │
    │ Port 3000  │         │  Port 3001   │
    └────────────┘         └──────┬───────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
            ┌────────────┐   ┌──────────┐   ┌──────────────┐
            │ PostgreSQL │   │  Redis   │   │  Job Queue   │
            │ 數據庫      │   │  快取    │   │  (Bull/RQ)   │
            │ Port 5432  │   │ Port 6379│   │              │
            └────────────┘   └──────────┘   └──────────────┘
                │
    ┌───────────┴─────────────────────────────┐
    │                                         │
    ▼                                         ▼
┌─────────────────────────┐      ┌──────────────────────┐
│   EDM 追蹤表            │      │   社群媒體表          │
│   - campaigns           │      │   - meta_posts       │
│   - subscribers         │      │   - linkedin_posts   │
│   - analytics           │      │   - utm_links        │
└─────────────────────────┘      └──────────────────────┘
```

## 技術棧

### 前端 (apps/web)

```
Next.js 14
├── React 18
├── TypeScript
├── TailwindCSS (样式)
├── Axios (HTTP 客户端)
├── Zustand (状态管理)
└── Recharts (数据可视化)
```

### 後端 (apps/api)

```
Node.js + Express
├── TypeScript
├── Knex.js (ORM/数据库迁移)
├── PostgreSQL (主数据库)
├── Redis (缓存)
├── JWT (认证)
├── Winston (日志)
└── Node-Cron (任务调度)
```

### 第三方集成

```
API 集成
├── Meta Graph API (Facebook/Instagram)
├── Google Ads API
├── MailerLite API
├── LinkedIn API
└── Stripe API (可选支付)
```

### 部署

```
Docker & Kubernetes
├── Docker Compose (本地/小型部署)
├── Kubernetes (大型生产)
├── AWS / DigitalOcean / Heroku
└── CI/CD (GitHub Actions)
```

## 数据流

### 1. 用户认证流

```
用户登录 → 前端 → API /auth/login
           ↓
       验证用户 → 生成 JWT → 返回令牌
           ↓
       存储在 localStorage → 后续请求添加令牌
```

### 2. EDM 活动创建流

```
用户输入 → 前端表单 → API /edm/campaigns (POST)
                      ↓
                   验证 → 保存到数据库
                      ↓
                   定时任务检查
                      ↓
                   发送时间到达 → 调用 MailerLite API
                      ↓
                   更新活动状态 → 记录分析数据
```

### 3. 社群媒体内容排程流

```
用户创建贴文 → 前端 → API /meta/posts/schedule
                     ↓
              存储排程记录
                     ↓
              定时任务每分钟检查
                     ↓
              发布时间到达 → 调用 Meta Graph API
                     ↓
              获取互动数据 → 更新分析指标
```

### 4. UTM 追蹤流

```
用户生成 UTM 链接
     ↓
  保存到数据库
     ↓
  用户在贴文中使用链接
     ↓
  粉丝点击链接
     ↓
  追蹤像素/JS 记录点击事件
     ↓
  数据保存到数据库
     ↓
  显示在分析仪表板
```

## 数据库设计

### 核心表结构

```sql
-- 用户表
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── name
└── timestamps

-- EDM 相关表
edm_campaigns
├── id (PK)
├── user_id (FK)
├── subject
├── content
├── status (draft/scheduled/sent)
├── scheduled_time
└── metrics (sent_count, open_count, etc.)

edm_subscribers
├── id (PK)
├── user_id (FK)
├── email
├── status (active/inactive/unsubscribed)
└── tags (JSON)

-- 社群媒体表
meta_accounts
├── id (PK)
├── user_id (FK)
├── account_id
└── access_token

meta_posts
├── id (PK)
├── user_id (FK)
├── account_id (FK)
├── content
├── scheduled_time
├── status (draft/scheduled/published)
└── metrics (likes, comments, shares)

linkedin_posts
├── id (PK)
├── user_id (FK)
├── profile_id (FK)
├── content
├── scheduled_time
├── status
└── metrics

-- UTM 追蹤表
utm_links
├── id (PK)
├── user_id (FK)
├── utm_link (UNIQUE)
├── utm_source
├── utm_medium
├── utm_campaign
└── clicks

utm_click_events
├── id (PK)
├── utm_link_id (FK)
├── referrer
├── timestamp

-- 广告表
ad_campaigns
├── id (PK)
├── user_id (FK)
├── platform (facebook/google/etc)
├── name
├── budget
├── status
└── metrics (spend, impressions, conversions)

-- 报告表
reports
├── id (PK)
├── user_id (FK)
├── type (monthly/weekly/custom)
├── period
├── data (JSON)
└── created_at

scheduled_reports
├── id (PK)
├── user_id (FK)
├── frequency (daily/weekly/monthly)
├── recipient_email
└── is_active
```

### 索引策略

```
主要索引：
- users(email) - 用户查询
- edm_campaigns(user_id, status)
- meta_posts(user_id, created_at)
- ad_campaigns(user_id, status)
- utm_links(user_id, utm_campaign)
- reports(user_id, created_at)
```

## API 架构

### 路由结构

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /register
│   └── POST /logout
│
├── /dashboard
│   ├── GET /overview
│   ├── GET /metrics
│   └── GET /activities
│
├── /edm
│   ├── GET /campaigns
│   ├── POST /campaigns
│   ├── POST /campaigns/:id/send
│   ├── GET /subscribers
│   └── POST /subscribers
│
├── /meta
│   ├── POST /connect
│   ├── GET /posts/analytics
│   ├── POST /posts/schedule
│   └── GET /insights/:account_id
│
├── /linkedin
│   ├── POST /connect
│   ├── POST /posts/schedule
│   ├── POST /posts/:id/publish
│   └── GET /posts/analytics
│
├── /mailerlite
│   ├── POST /connect
│   ├── GET /subscribers
│   ├── POST /campaigns
│   └── POST /campaigns/:id/send
│
├── /utm
│   ├── POST /generate
│   ├── GET /
│   └── GET /:id/performance
│
├── /ads
│   ├── GET /campaigns
│   ├── POST /campaigns
│   ├── GET /campaigns/:id/performance
│   └── GET /funnel/:id
│
└── /reports
    ├── GET /
    ├── POST /generate/monthly
    ├── GET /:id/export/pdf
    └── POST /schedule
```

## 身份认证与授权

### JWT 令牌结构

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": 1,
    "email": "user@example.com",
    "iat": 1692633600,
    "exp": 1693238400
  },
  "signature": "..."
}
```

### 权限控制

```
级别 1：认证 (已登录)
- 需要有效的 JWT 令牌

级别 2：资源所有权
- 用户只能访问自己的数据
- 通过 user_id 验证

级别 3：功能权限 (可选)
- 订阅等级决定功能访问权
- 存储在 users 表
```

## 性能优化

### 1. 缓存策略

```
Redis 缓存
├── Dashboard 数据 (5 分钟)
├── 分析指标 (10 分钟)
├── 用户会话 (24 小时)
└── API 响应 (根据需求)
```

### 2. 数据库优化

```
- 查询优化：使用索引
- 连接池：PgBouncer
- 读写分离：只读副本
- 分区：按时间或用户分区大表
```

### 3. 前端优化

```
Next.js 优化
├── 代码分割
├── 动态导入
├── 图像优化
├── 静态生成 (SSG)
└── 增量静态再生成 (ISR)
```

### 4. API 优化

```
- 分页：limit/offset
- 字段过滤：select 需要的字段
- 请求限流：Rate limiting
- gzip 压缩：响应体压缩
```

## 监控与日志

### 日志架构

```
应用日志
├── Winston (结构化日志)
├── 级别：info/warn/error
├── 输出：文件 + 控制台
└── 格式：JSON

系统日志
├── Docker 日志
├── Nginx 日志
└── 数据库日志
```

### 监控指标

```
应用监控
├── API 响应时间
├── 错误率
├── 并发用户数
└── 资源使用情况

基础设施
├── CPU 使用率
├── 内存使用率
├── 磁盘 I/O
└── 网络吞吐量
```

## 自动化与任务调度

### 定时任务

```
Cron 任务
├── 每分钟：检查排程的贴文和电子邮件
├── 每小时：更新分析数据
├── 每天：生成每日报告
├── 每周：生成周报告
└── 每月：生成月报告
```

### 后台任务队列

```
Bull (Redis 队列)
├── 发送电子邮件
├── 发布社交媒体
├── 生成报告
├── 同步分析数据
└── 备份数据库
```

## 安全最佳实践

### 1. 认证安全

```
- 密码：bcryptjs 加密
- 令牌：HS256 签名
- HTTPS：SSL/TLS 加密
- 令牌过期：7 天有效期
```

### 2. 数据安全

```
- 敏感数据加密
- SQL 注入防护：参数化查询
- XSS 防护：输入验证
- CSRF 防护：令牌验证
```

### 3. API 安全

```
- CORS：严格白名单
- Rate Limiting：防止滥用
- 输入验证：Joi/Yup
- 错误处理：避免敏感信息泄露
```

### 4. 部署安全

```
- 环境变量：密钥管理
- 防火墙规则
- 定期备份
- 访问控制：IAM 策略
```

## 扩展性设计

### 水平扩展

```
负载均衡
├── Nginx 负载均衡器
├── 多个 API 实例
├── 数据库读副本
└── Redis 集群
```

### 垂直扩展

```
资源升级
├── 增加 CPU 核心
├── 增加内存
├── 更快的存储
└── 更高带宽网络
```

### 微服务架构 (未来)

```
可能的分离
├── Auth Service
├── EDM Service
├── Social Media Service
├── Analytics Service
└── Reporting Service
```

## 灾难恢复

### 备份策略

```
数据备份
├── 每日完整备份
├── 每小时增量备份
├── 异地存储（AWS S3）
└── 保留期：90 天
```

### 高可用性

```
- 数据库主从复制
- API 无状态设计
- 会话存储在 Redis
- 自动故障转移
```

### 恢复流程

```
1. 检测故障
2. 激活备用系统
3. 恢复数据到最近备份
4. 验证系统功能
5. 切换流量
6. 事后分析
```
