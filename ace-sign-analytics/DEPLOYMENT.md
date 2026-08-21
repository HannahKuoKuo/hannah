# ACE Sign Analytics 部署指南

## 目录

1. [本地开发](#本地开发)
2. [Docker 部署](#docker-部署)
3. [云部署](#云部署)
4. [监控和维护](#监控和维护)

## 本地开发

### 系统要求

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (可选)

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository>
cd ace-sign-analytics
```

2. **安装依赖**
```bash
make install
# 或手动安装
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

3. **配置环境变量**
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

编辑 `.env` 文件，填入实际的 API 凭证。

4. **初始化数据库**
```bash
# 使用 psql 连接到 PostgreSQL
psql -U postgres -d ace_analytics_db -f database/schema.sql
```

5. **启动应用**
```bash
# 终端 1: 后端
cd backend && npm run dev

# 终端 2: 前端
cd frontend && npm run dev
```

访问 http://localhost:5173

## Docker 部署

### 快速启动

```bash
docker-compose up -d
```

### 日志查看

```bash
docker-compose logs -f
# 或特定服务
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 进入容器

```bash
docker exec -it ace-analytics-api bash
docker exec -it ace-analytics-db psql -U postgres
```

### 数据库备份

```bash
docker exec ace-analytics-db pg_dump -U postgres ace_analytics_db > backup.sql
```

### 数据库恢复

```bash
docker exec -i ace-analytics-db psql -U postgres ace_analytics_db < backup.sql
```

### 清理和重置

```bash
# 停止并删除容器和卷
docker-compose down -v

# 完全清理
docker system prune -a
```

## 云部署

### Heroku 部署

#### 前置条件
- Heroku CLI
- GitHub 账户

#### 部署步骤

```bash
# 1. 登录 Heroku
heroku login

# 2. 创建应用
heroku create ace-sign-analytics

# 3. 添加 PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 4. 设置环境变量
heroku config:set JWT_SECRET=your_secret_key
heroku config:set MAILERLITE_API_TOKEN=your_token
heroku config:set META_APP_ID=your_app_id
heroku config:set META_APP_SECRET=your_secret
heroku config:set GA4_PROPERTY_ID=your_property_id
heroku config:set GA4_API_KEY=your_api_key

# 5. 推送代码
git push heroku main

# 6. 迁移数据库
heroku run npm run db:migrate

# 7. 查看应用
heroku open
```

### AWS EC2 部署

#### 1. 启动 EC2 实例

```bash
# 选择 Ubuntu 20.04 LTS AMI
# 实例类型: t3.medium 或更大
# 安全组: 开放 80, 443, 3000, 5173 端口
```

#### 2. SSH 连接并安装依赖

```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# 更新系统
sudo apt update
sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ${USER}

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Nginx
sudo apt install -y nginx
```

#### 3. 部署应用

```bash
# 克隆仓库
git clone <repository>
cd ace-sign-analytics

# 配置环境变量
nano .env
# 填入 API 凭证

# 启动应用
docker-compose up -d
```

#### 4. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80 default_server;
    server_name _;

    # 前端
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# 重启 Nginx
sudo systemctl restart nginx
```

#### 5. SSL 证书 (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### DigitalOcean App Platform

#### 1. 创建 App

- 登录 DigitalOcean
- 创建新 App
- 连接 GitHub 仓库

#### 2. 环境变量配置

在 DigitalOcean 控制面板设置：
- `NODE_ENV=production`
- `JWT_SECRET`
- `MAILERLITE_API_TOKEN`
- 等其他 API 凭证

#### 3. 自动部署

GitHub 连接后，每次 push 到 main 分支都会自动部署。

## 监控和维护

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看日志
docker-compose logs --tail 100 backend
```

### 数据库维护

```bash
# 连接到数据库
docker exec -it ace-analytics-db psql -U postgres -d ace_analytics_db

# 常用命令
\dt                    # 列出所有表
SELECT COUNT(*) FROM users;  # 查看用户数
VACUUM ANALYZE;        # 优化数据库
```

### 定期备份

```bash
#!/bin/bash
# backup.sh
docker exec ace-analytics-db pg_dump -U postgres ace_analytics_db > \
  backup_$(date +%Y%m%d_%H%M%S).sql
```

```bash
# 设置 cron 任务 (每天凌晨 2 点)
0 2 * * * /path/to/backup.sh
```

### 日志分析

```bash
# 查看最近的错误
docker-compose logs backend | grep ERROR

# 保存日志到文件
docker-compose logs > app_logs.txt
```

### 性能优化

1. **启用数据库连接池**
   - 在 `backend/src/config/database.ts` 中配置 `max` 连接数

2. **添加缓存**
   - 使用 Redis 缓存热数据

3. **CDN**
   - 使用 Cloudflare 加速静态资源

4. **压缩**
   - 启用 gzip 压缩

## 故障恢复

### 应用无法启动

```bash
# 查看日志
docker-compose logs backend

# 检查依赖
docker-compose ps

# 重建镜像
docker-compose build --no-cache
docker-compose up -d
```

### 数据库连接失败

```bash
# 检查数据库服务
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# 重置数据库
docker-compose down -v
docker-compose up postgres
```

### 内存溢出

```bash
# 增加容器内存限制
# docker-compose.yml 中添加:
# services:
#   backend:
#     mem_limit: 1g
```

## 安全检查清单

- [ ] 所有敏感凭证都在环境变量中
- [ ] 启用 HTTPS (Let's Encrypt)
- [ ] 配置防火墙规则
- [ ] 定期备份数据库
- [ ] 监控日志
- [ ] 更新依赖包
- [ ] 启用数据库访问控制

---

需要帮助? 联系 hannah@acesign.com.au
