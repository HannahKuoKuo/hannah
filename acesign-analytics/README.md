# ACE Sign Analytics

🚀 **Complete Marketing Intelligence Platform** - Monitor all your marketing channels in one place.

Monitor email campaigns (MailerLite), social media (Meta/Instagram/Facebook, LinkedIn), website traffic (Google Analytics 4), and track UTM links with comprehensive reporting and analytics.

## 📋 Features

### 📊 Unified Dashboard
- Real-time marketing metrics overview
- Channel performance visualization
- Key performance indicators tracking
- Quick access to all features

### 📧 Email Marketing (MailerLite)
- Campaign management and tracking
- Subscriber analytics
- Open and click rate tracking
- Campaign performance insights
- Automated sync

### 📱 Social Media Analytics
- Instagram & Facebook post tracking
- LinkedIn post performance
- Engagement metrics (likes, comments, shares)
- Follower demographics
- Multi-platform insights

### 🔗 UTM Tracking
- Generate UTM links easily
- Track clicks and conversions
- Campaign attribution
- Geographic insights
- Device/browser analytics

### 📅 Content Calendar
- Schedule posts across platforms
- Content status tracking
- Batch publishing
- Draft management

### 📈 Google Analytics 4 Integration
- User metrics tracking
- Traffic source analysis
- Conversion tracking
- Revenue analytics
- Custom event tracking

### 📄 Reports & Analytics
- Monthly and weekly reports
- PDF export
- Cross-channel analytics
- ROI calculation
- Report history

### 🔐 Security & Authentication
- JWT-based authentication
- Secure password hashing (bcryptjs)
- Protected API endpoints
- Session management

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + Next.js 14
- Tailwind CSS
- Recharts for visualization
- Zustand for state management
- Axios for API communication

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL database
- Redis caching
- JWT authentication

**DevOps:**
- Docker & Docker Compose
- Nginx reverse proxy
- SSL/TLS encryption
- Health checks

### Project Structure

```
acesign-analytics/
├── frontend/                 # Next.js React dashboard
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # Reusable React components
│   │   ├── lib/             # Utilities and API client
│   │   └── store/           # Zustand state management
│   └── package.json
├── backend/                  # Express API server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, error handling
│   │   ├── utils/           # Utilities (DB, Redis, logger)
│   │   └── integrations/    # Third-party APIs
│   └── package.json
├── database/                 # Database schema
│   └── schema.sql           # PostgreSQL schema
├── deployment/              # Deployment configs
│   └── nginx.conf           # Nginx configuration
├── docker-compose.yml       # Docker services
└── DEPLOYMENT.md            # Deployment guide
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 13+ (or Docker)
- Redis 6+ (or Docker)

### Local Development

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd acesign-analytics
   ```

2. **Setup with Docker Compose**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Start all services
   docker-compose up -d
   ```

3. **Access application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - API Docs: http://localhost:3001/health

### Manual Setup

```bash
# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

## 📦 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Dashboard
- `GET /api/dashboard` - Dashboard overview
- `GET /api/dashboard/refresh` - Refresh cache

### MailerLite
- `GET /api/mailerlite/campaigns` - List campaigns
- `GET /api/mailerlite/analytics` - Email analytics
- `POST /api/mailerlite/sync` - Sync data

### Social Media
- `GET /api/meta/posts` - Get Meta/Instagram posts
- `GET /api/meta/analytics` - Social analytics
- `GET /api/linkedin/posts` - Get LinkedIn posts
- `POST /api/meta/sync` - Sync Meta data

### UTM Tracking
- `POST /api/utm/generate` - Create UTM link
- `GET /api/utm/links` - Get user's UTM links
- `GET /api/utm/links/:id/stats` - Link statistics
- `POST /api/utm/links/:id/click` - Record click

### Analytics
- `GET /api/analytics/summary` - Analytics summary
- `GET /api/analytics/channels` - Channel breakdown
- `GET /api/analytics/roi` - ROI metrics

### Reports
- `POST /api/reports/generate/monthly` - Generate monthly
- `POST /api/reports/generate/weekly` - Generate weekly
- `GET /api/reports` - List reports

## 🔧 Configuration

### Environment Variables

Create `.env` file with:

```env
# Server
NODE_ENV=development
API_PORT=3001
API_HOST=localhost

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=acesign_analytics

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_secret_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password

# Integrations
MAILERLITE_API_KEY=your_key
META_APP_ID=your_id
GA4_PROPERTY_ID=your_id
```

See `.env.example` for all available options.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Frontend README](./frontend/README.md) - Frontend documentation
- [Backend README](./backend/README.md) - Backend documentation

## 🗄️ Database

PostgreSQL schema includes:
- **Users**: Authentication and profiles
- **MailerLite**: Campaigns, subscribers, stats
- **Meta**: Posts, engagement, followers
- **LinkedIn**: Posts and engagement
- **GA4**: Daily metrics, traffic sources
- **UTM**: Links and click events
- **Content Calendar**: Scheduled content
- **Reports**: Generated reports

Run migrations:
```bash
npm run migrate
```

## 🚢 Deployment

### Docker Compose
```bash
docker-compose up -d
```

### Production with Nginx
```bash
docker-compose --profile production up -d
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📊 Key Metrics

The platform tracks:
- Email open/click rates
- Social engagement (likes, comments, shares)
- Website traffic and users
- Conversion rates and revenue
- UTM click attribution
- Content performance
- Channel ROI

## 🔒 Security

- JWT token authentication
- Secure password hashing (bcryptjs)
- Environment variable secrets
- SQL injection prevention (Knex.js)
- CORS protection
- Rate limiting ready
- SSL/TLS in production
- Helmet security headers

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Type checking
npm run type-check
```

## 📝 API Documentation

### Authentication Headers
All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Error Responses
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/endpoint"
}
```

## 🐛 Troubleshooting

### Common Issues

**Database connection error:**
```bash
docker-compose logs postgres
docker-compose restart postgres
```

**Redis connection error:**
```bash
docker-compose logs redis
docker-compose restart redis
```

**API not responding:**
```bash
docker-compose logs backend
curl http://localhost:3001/health
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more troubleshooting.

## 📈 Performance Optimization

- Redis caching for frequently accessed data
- Database query optimization with indexes
- Connection pooling (Knex.js)
- Next.js automatic code splitting
- Image optimization
- Gzip compression

## 🤝 Contributing

Contributions welcome! Please ensure:
- Code follows existing style
- Tests pass
- TypeScript types are correct
- Commit messages are descriptive

## 📄 License

Proprietary - ACE Sign Analytics

## 📞 Support

For support:
- Email: support@acesign.com
- Issues: GitHub Issues
- Documentation: See DEPLOYMENT.md

---

Built with ❤️ by ACE Sign Team
