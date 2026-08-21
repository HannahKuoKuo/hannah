# ACE Sign Analytics 架构文档

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                  Client (浏览器)                      │
│            React + TypeScript + TailwindCSS          │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
┌────────────────────┴────────────────────────────────┐
│              Nginx (反向代理)                        │
│            负载均衡 & SSL/TLS                        │
└────────────────────┬────────────────────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │                                 │
┌───┴────────────────────────┐   ┌───┴──────────────────────────┐
│    Node.js API Server      │   │   PostgreSQL Database         │
│    (Express + TypeScript)  │   │   (数据存储)                  │
│                            │   │                              │
│  ├── 认证路由             │   ├── 用户表                     │
│  ├── 仪表板               │   ├── 配置表                     │
│  ├── 第三方集成           │   ├── 指标表                     │
│  ├── 内容日历             │   └── 报告表                     │
│  └── 报告生成             │                                  │
│                            │                                  │
│  定时任务 (node-cron)     │                                  │
│  ├── Meta 数据同步        │                                  │
│  ├── Email 数据同步       │                                  │
│  ├── GA4 数据同步         │                                  │
│  └── 报告生成             │                                  │
└────────────────────────────┘   └────────────────────────────┘
         │         │
         │         └─────────────────────────────────────┐
         │                                               │
    ┌────┴─────────────────┐                            │
    │                      │                            │
┌───┴──────────────────┐  ┌──────────────────────────┐  │
│  MailerLite API      │  │  Meta Graph API          │  │
│  (邮件营销数据)      │  │  (社媒数据)              │  │
└──────────────────────┘  └──────────────────────────┘  │
                                                        │
                          ┌─────────────────────────────┘
                          │
                   ┌──────┴──────────────────┐
                   │ Google Analytics 4 API  │
                   │ (网站分析数据)          │
                   └─────────────────────────┘
```

## 核心模块

### 1. 后端架构 (Backend)

#### 目录结构
```
backend/
├── src/
│   ├── index.ts              # 应用入口
│   ├── config/               # 配置文件
│   │   └── database.ts
│   ├── database/             # 数据库操作
│   │   ├── connection.ts
│   │   └── migrations/
│   ├── middleware/           # 中间件
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── routes/               # API 路由
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── contentCalendar.ts
│   │   ├── reports.ts
│   │   ├── utm.ts
│   │   └── integrations/
│   │       ├── meta.ts
│   │       ├── email.ts
│   │       └── ga4.ts
│   ├── services/             # 业务逻辑
│   │   ├── scheduler.ts
│   │   ├── reportGenerator.ts
│   │   └── integrations/
│   │       ├── meta.ts
│   │       ├── mailerlite.ts
│   │       └── ga4.ts
│   └── utils/                # 工具函数
│       └── logger.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

#### 关键类和服务

**MetaService**
- 获取页面洞察 (impressions, reach, followers)
- 发布内容
- 获取帖子指标

**MailerLiteService**
- 获取活动列表
- 获取活动统计
- 管理订阅者

**GA4Service**
- 获取网站指标
- 获取转化数据
- 页面分析

**Scheduler**
- Meta 数据同步 (每小时)
- Email 数据同步 (每 2 小时)
- GA4 数据同步 (每 3 小时)
- 自动报告生成 (每天 9:00)

### 2. 前端架构 (Frontend)

#### 目录结构
```
frontend/
├── src/
│   ├── main.tsx              # 入口点
│   ├── App.tsx               # 路由定义
│   ├── components/           # 可复用组件
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── StatCard.tsx
│   ├── pages/                # 页面
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── ContentCalendar.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── stores/               # 状态管理
│   │   └── authStore.ts      # Zustand store
│   ├── utils/                # 工具函数
│   └── index.css             # 全局样式
├── vite.config.ts
├── tailwind.config.js
└── Dockerfile
```

#### 页面和功能

| 页面 | 功能 |
|------|------|
| Login | 用户认证 (注册/登录) |
| Dashboard | 概览、KPI、图表 |
| Analytics | 详细数据分析、社媒分布 |
| ContentCalendar | 内容计划、日历视图 |
| Reports | 报告生成、下载 |
| Settings | API 配置、系统设置 |

### 3. 数据库设计

#### 核心表

**users**
- id (UUID)
- email (VARCHAR)
- password (VARCHAR hashed)
- name (VARCHAR)
- created_at, updated_at

**user_config**
- id (UUID)
- user_id (FK)
- mailerlite_api_token
- meta_access_token, meta_page_id
- ga4_property_id, ga4_api_key

**email_metrics**
- id (UUID)
- user_id (FK)
- campaign_id
- opens, clicks, bounces, unsubscribes (INT)
- data (JSONB)
- created_at

**social_metrics**
- id (UUID)
- user_id (FK)
- platform (VARCHAR)
- impressions, reach, engagement (INT)
- data (JSONB)
- created_at

**ga_metrics**
- id (UUID)
- user_id (FK)
- active_users, sessions (INT)
- engagement_rate, bounce_rate (DECIMAL)
- data (JSONB)
- created_at

**content_calendar**
- id (UUID)
- user_id (FK)
- title, content
- platform, scheduled_date
- status (draft/scheduled/published)

**utm_links**
- id (UUID)
- user_id (FK)
- base_url, utm_url
- source, medium, campaign, content
- clicks (INT)

**reports**
- id (UUID)
- user_id (FK)
- title, content (JSONB)
- start_date, end_date
- created_at

## API 设计

### 请求/响应模式

```typescript
// 请求
{
  "email": "user@example.com",
  "password": "secure_password"
}

// 成功响应 (200)
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "statusCode": 400
  }
}
```

### 认证

- JWT Token 在 Header 中: `Authorization: Bearer <token>`
- Token 过期时间: 7 天
- 刷新策略: 需要重新登录

## 数据流

### 实时数据同步

```
定时任务 (Cron)
    ↓
调用第三方 API
    ↓
解析响应数据
    ↓
数据验证和转换
    ↓
存储到 PostgreSQL
    ↓
前端轮询或 WebSocket
    ↓
Dashboard 更新
```

### 报告生成流程

```
用户请求 / 定时触发
    ↓
收集所有指标数据
    ↓
计算派生指标
    ↓
生成 PDF/CSV
    ↓
存储报告
    ↓
发送邮件通知
```

## 安全性

### 认证和授权

1. **密码** - bcryptjs 加密存储
2. **JWT** - 无状态认证
3. **HTTPS** - 生产环境强制
4. **Rate Limiting** - 防暴力破解
5. **CORS** - 跨域验证

### 数据保护

- 敏感数据加密存储
- SQL 注入防护 (参数化查询)
- XSS 防护 (HTML 转义)
- CSRF Token (可选)
- 日志不记录敏感信息

## 性能优化

### 数据库
- 索引优化
- 连接池 (max: 20)
- 查询优化
- 定期维护 (VACUUM)

### 缓存
- Redis (可选)
- 浏览器缓存
- CDN (静态资源)

### 前端
- 代码分割
- 树摇优化
- 图片懒加载
- 虚拟滚动

## 部署拓扑

### 开发环境
```
Docker Compose
├── Frontend (Vite dev server)
├── Backend (Node.js dev server)
└── PostgreSQL (容器)
```

### 生产环境
```
Cloud Provider (AWS/Heroku/DigitalOcean)
├── Nginx (反向代理 + SSL)
├── Node.js API (多实例)
├── PostgreSQL (托管服务)
└── CDN (Cloudflare)
```

## 监控和日志

### 日志级别
- DEBUG: 开发调试
- INFO: 重要事件
- WARN: 警告信息
- ERROR: 错误信息

### 监控指标
- API 响应时间
- 数据库查询性能
- 内存和 CPU 使用
- 错误率
- API 调用量

## 扩展性

### 新增 API 集成步骤

1. 创建 Service 类: `src/services/integrations/newapi.ts`
2. 创建路由: `src/routes/integrations/newapi.ts`
3. 添加数据表和字段
4. 配置定时同步
5. 更新前端 UI

### 新增页面步骤

1. 创建页面组件: `frontend/src/pages/NewPage.tsx`
2. 添加路由: `frontend/src/App.tsx`
3. 创建 API 调用服务
4. 添加导航菜单

---

最后更新: 2024年8月
