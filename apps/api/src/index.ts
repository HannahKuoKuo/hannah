import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeLogger } from './utils/logger';
import { initializeDatabase } from './utils/database';
import { initializeRedis } from './utils/redis';
import { initializeScheduler } from './services/scheduler';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import metaRoutes from './routes/meta';
import edamRoutes from './routes/edm';
import adsRoutes from './routes/ads';
import reportsRoutes from './routes/reports';
import utmRoutes from './routes/utm';
import linkedinRoutes from './routes/linkedin';
import mailerliteRoutes from './routes/mailerlite';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const logger = initializeLogger();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/meta', authMiddleware, metaRoutes);
app.use('/api/edm', authMiddleware, edamRoutes);
app.use('/api/ads', authMiddleware, adsRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
app.use('/api/utm', authMiddleware, utmRoutes);
app.use('/api/linkedin', authMiddleware, linkedinRoutes);
app.use('/api/mailerlite', authMiddleware, mailerliteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize services
async function start() {
  try {
    await initializeDatabase();
    await initializeRedis();
    initializeScheduler();

    const port = process.env.API_PORT || 3001;
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
