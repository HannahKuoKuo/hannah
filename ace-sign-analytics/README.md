# ACE Sign Analytics - Marketing Monitoring Platform

完整的营销监测平台，整合 MailerLite、Meta、Google Analytics 4。

## 特性

- 📊 **实时数据分析** - Meta、Email、GA4 数据实时同步
- 📅 **内容日历** - 管理和计划社媒内容
- 📧 **邮件整合** - MailerLite 集成和统计
- 🎯 **UTM 链接管理** - 创建和追踪 UTM 链接
- 📈 **自动报告生成** - 每日、周、月报告
- 🔐 **安全认证** - JWT 令牌认证
- 🚀 **可扩展架构** - 模块化设计

## 技术栈

### 后端
- Node.js + Express + TypeScript
- PostgreSQL
- JWT 认证
- node-cron 任务调度

### 前端
- React 18 + TypeScript
- TailwindCSS
- Recharts 数据可视化
- Zustand 状态管理
- Vite 构建工具

### 基础设施
- Docker & Docker Compose
- Nginx 反向代理
- PostgreSQL 数据库

## 快速开始

### 前置条件
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15+

### 环境配置

1. **复制环境变量文件**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. **配置 API 凭证**

编辑 `backend/.env`，填入：
- `MAILERLITE_API_TOKEN`
- `META_APP_ID` 和 `META_APP_SECRET`
- `GA4_PROPERTY_ID` 和 `GA4_API_KEY`

⚠️ **重要：永远不要在代码中硬编码凭证！使用环境变量。**

### 使用 Docker 运行

```bash
docker-compose up -d
```

应用将在以下地址运行：
- 前端: http://localhost:5173
- 后端 API: http://localhost:3000
- 数据库: localhost:5432

### 本地开发

#### 后端

```bash
cd backend
npm install
npm run dev
```

#### 前端

```bash
cd frontend
npm install
npm run dev
```

## 项目结构

```
ace-sign-analytics/
├── backend/
│   ├── src/
│   │   ├── index.ts              # 主应用入口
│   │   ├── routes/               # API 路由
│   │   ├── services/             # 业务逻辑和集成
│   │   ├── middleware/           # 中间件
│   │   ├── database/             # 数据库连接
│   │   └── utils/                # 工具函数
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # 入口点
│   │   ├── App.tsx               # 主应用
│   │   ├── pages/                # 页面组件
│   │   ├── components/           # 可复用组件
│   │   └── stores/               # Zustand 状态
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── index.html
├── database/
│   └── schema.sql                # 数据库架构
├── docker-compose.yml
└── README.md
```

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 仪表板
- `GET /api/dashboard/overview` - 获取概览数据
- `GET /api/dashboard/metrics` - 获取详细指标

### 集成
- `GET /api/integrations/meta/insights` - Meta 数据
- `GET /api/integrations/email/campaigns` - MailerLite 数据
- `GET /api/integrations/ga4/metrics` - GA4 数据

### 内容日历
- `GET /api/content-calendar` - 列表
- `POST /api/content-calendar` - 创建
- `PUT /api/content-calendar/:id` - 更新
- `DELETE /api/content-calendar/:id` - 删除

### 报告
- `GET /api/reports` - 列表
- `POST /api/reports/generate` - 生成报告
- `GET /api/reports/:id` - 详情

## 数据库表

- `users` - 用户账户
- `user_config` - 用户 API 配置
- `email_metrics` - 邮件指标
- `social_metrics` - 社媒指标
- `ga_metrics` - GA4 指标
- `content_calendar` - 内容日历
- `utm_links` - UTM 链接
- `reports` - 生成的报告
- `analytics_data` - 分析数据

## 定时任务

系统每小时运行以下定时任务：
- **每小时** - 同步 Meta 数据
- **每 2 小时** - 同步 MailerLite 数据
- **每 3 小时** - 同步 GA4 数据
- **每天 9:00** - 生成日报告

## 安全实践

1. **不要共享凭证** - 使用环境变量和密钥管理工具
2. **HTTPS 生产环境** - 总是使用 HTTPS
3. **验证输入** - 所有输入都经过 Joi 验证
4. **Rate Limiting** - API 端点有速率限制
5. **日志记录** - 使用 Winston 记录错误和活动

## 故障排除

### 数据库连接错误
```bash
# 检查 PostgreSQL 服务
docker ps | grep postgres

# 查看日志
docker logs ace-analytics-db
```

### API 连接错误
```bash
# 确保后端运行
docker logs ace-analytics-api

# 检查端口
lsof -i :3000
```

### 前端构建失败
```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

## 部署

### 生产部署

1. **设置环境变量** - 在 CI/CD 系统中设置
2. **构建镜像** - `docker build`
3. **推送到仓库** - Docker Hub 或私有仓库
4. **部署** - Kubernetes、Heroku、AWS EC2 等

### Heroku 部署

```bash
heroku create ace-sign-analytics
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 支持

邮件: hannah@acesign.com.au
网站: https://acesign.com.au

---

**最后更新**: 2024年8月
**版本**: 1.0.0
