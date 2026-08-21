# ACE Sign Analytics - Deployment Guide

Complete guide for deploying the ACE Sign Analytics platform locally and in production.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd acesign-analytics
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy example files
   cp .env.example .env
   
   # Edit .env with your settings
   ```

4. **Start services**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - API Health: http://localhost:3001/health

---

## Docker Deployment

### Using Docker Compose (Recommended)

**Quick Start:**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f
```

**Services:**
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Backend API: localhost:3001
- Frontend: localhost:3000

**Common Commands:**
```bash
# Stop all services
docker-compose down

# Rebuild containers
docker-compose up -d --build

# View specific service logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend npm run migrate

# Stop and remove volumes
docker-compose down -v
```

---

## Production Deployment

### Server Requirements

- Ubuntu 20.04 LTS or similar
- 4GB RAM minimum
- 20GB storage
- Docker & Docker Compose installed
- SSL certificate (Let's Encrypt recommended)

### Step-by-Step Deployment

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Clone Repository

```bash
cd /opt
sudo git clone <repository-url> acesign-analytics
cd acesign-analytics
```

#### 3. Configure Production Environment

```bash
# Copy production env template
cp .env.example .env.production

# Edit with production values
sudo nano .env.production

# Example production settings:
NODE_ENV=production
API_PORT=3001
DATABASE_HOST=postgres
REDIS_URL=redis://redis:6379
JWT_SECRET=<generate-secure-secret>
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

#### 4. Database Migration

```bash
# First run: Initialize database
docker-compose exec backend npm run migrate

# Seed data (if needed)
docker-compose exec backend npm run seed
```

#### 5. SSL Configuration

```bash
# Create SSL directory
mkdir -p deployment/ssl

# Using Let's Encrypt (Certbot)
sudo apt install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem deployment/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem deployment/ssl/
```

#### 6. Configure Nginx

Update `deployment/nginx.conf`:
```nginx
upstream backend {
    server backend:3001;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://backend/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 7. Start Production Services

```bash
# Enable production profile
docker-compose --profile production up -d

# Verify all services
docker-compose ps

# Check logs
docker-compose logs -f
```

#### 8. Auto-renewal SSL Certificates

```bash
# Create renewal cron job
sudo crontab -e

# Add this line:
0 3 * * * /usr/bin/certbot renew --quiet
```

---

## Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=production
API_PORT=3001
API_HOST=0.0.0.0

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=acesign_analytics

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your_secure_jwt_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application URLs
APP_URL=https://yourdomain.com

# MailerLite Integration
MAILERLITE_API_KEY=your_mailerlite_api_key
MAILERLITE_ACCOUNT_ID=your_account_id

# Meta Integration
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_PAGE_ACCESS_TOKEN=your_access_token

# Google Analytics 4
GA4_PROPERTY_ID=your_property_id
GA4_ACCESS_TOKEN=your_access_token
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

---

## Database Setup

### Backups

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres acesign_analytics > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres < backup.sql
```

### Migrations

```bash
# Run pending migrations
docker-compose exec backend npm run migrate

# Create new migration
docker-compose exec backend npx knex migrate:make create_table_name
```

---

## Monitoring & Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last N lines
docker-compose logs --tail 100 backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Database connection
docker-compose exec postgres pg_isready
```

### Resource Usage

```bash
# View resource usage
docker stats

# Backend memory/CPU
docker-compose stats backend
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# View PostgreSQL logs
docker-compose logs postgres
```

#### 2. Redis Connection Error

```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### 3. Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

#### 4. API Not Responding

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check all services are running
docker-compose ps
```

#### 5. Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Clear Next.js cache
docker-compose exec frontend rm -rf .next

# Rebuild frontend
docker-compose up -d --build frontend
```

### Debug Mode

```bash
# Enable debug logging
NODE_DEBUG=* docker-compose up backend

# Increase log verbosity
LOG_LEVEL=debug docker-compose up
```

---

## Production Checklist

- [ ] Update all environment variables
- [ ] Generate secure JWT secret
- [ ] Configure SSL certificates
- [ ] Set up automated backups
- [ ] Configure email (SMTP)
- [ ] Test API integrations (MailerLite, Meta, GA4)
- [ ] Enable rate limiting
- [ ] Set up monitoring/alerts
- [ ] Configure log aggregation
- [ ] Test database failover
- [ ] Verify auto-renewal of SSL certs
- [ ] Document credentials securely
- [ ] Set up support contacts
- [ ] Create runbook for operations

---

## Support

For issues or questions, contact support@acesign.com or open an issue on GitHub.
