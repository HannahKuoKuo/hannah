import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { initializeDatabase } from './database/connection';
import { startScheduledJobs } from './services/scheduler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

setupRoutes(app);
app.use(errorHandler);

async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database connected successfully');

    startScheduledJobs();
    logger.info('Scheduled jobs started');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
