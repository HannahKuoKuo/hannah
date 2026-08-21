# ACE Sign Analytics - Frontend Dashboard

React 18 + Next.js 14 frontend for the ACE Sign Analytics marketing intelligence platform.

## Features

- 📊 Real-time marketing dashboard
- 📧 Email campaign tracking (MailerLite)
- 📱 Social media analytics (Meta/Instagram/Facebook)
- 💼 LinkedIn post analytics
- 📈 Google Analytics 4 integration
- 🔗 UTM link tracking and management
- 📅 Content calendar
- 📄 Report generation and export
- 🔐 JWT authentication
- 📱 Responsive design
- 🎨 Tailwind CSS styling

## Tech Stack

- **Framework**: Next.js 14
- **UI**: React 18 + Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS + PostCSS
- **Icons**: React Icons

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Format code
npm run format
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   └── layout.tsx      # Root layout
├── components/         # Reusable components
├── lib/               # Utilities
│   └── apiClient.ts   # API communication
├── store/             # Zustand stores
│   └── authStore.ts   # Authentication state
└── types/             # TypeScript types
```

## API Integration

The frontend communicates with the backend API at `/api/*`. All protected routes require a valid JWT token.

### Authentication Flow

1. User logs in via `/auth/login`
2. Backend returns JWT token
3. Token stored in localStorage
4. Token included in all API requests via Authorization header

## Features

### Dashboard
- Overview of all marketing metrics
- Channel distribution visualization
- Recent reports preview
- Real-time data refresh

### Email Campaigns
- MailerLite campaigns list
- Campaign statistics
- Analytics and insights
- Email performance tracking

### Social Media
- Meta/Instagram/Facebook posts
- Engagement metrics
- Follower demographics
- Post insights

### UTM Tracking
- Generate UTM links
- Track clicks and conversions
- Campaign analytics
- Attribution reporting

### Content Calendar
- Schedule content
- Multi-platform publishing
- Status tracking
- Draft management

### Reports
- Monthly reports
- Weekly reports
- PDF export
- Report history

## Development

### Adding New Pages

1. Create new directory in `src/app/`
2. Add `page.tsx` component
3. Import needed components and hooks
4. Use API client for data fetching

### Adding New Components

1. Create `.tsx` file in `src/components/`
2. Export as default
3. Use in pages

### State Management

Use Zustand stores in `src/store/` for global state:

```typescript
import { useAuthStore } from '@/store/authStore';

const token = useAuthStore((state) => state.token);
```

## Building & Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

The build creates optimized production assets in `.next/`.

## License

Proprietary - ACE Sign Analytics
