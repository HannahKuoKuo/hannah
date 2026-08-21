import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import 'express-async-errors';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 导入服务和中间件
import { initializeDatabase } from './utils/database';
import { initializeRedis } from './utils/redis';
import { initializeScheduler } from './services/scheduler';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// 导入路由
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import mailerliteRoutes from './routes/mailerlite';
import metaRoutes from './routes/meta';
import linkedinRoutes from './routes/linkedin';
import ga4Routes from './routes/ga4';
import utmRoutes from './routes/utm';
import contentCalendarRoutes from './routes/contentCalendar';
import reportsRoutes from './routes/reports';
import analyticsRoutes from './routes/analytics';
import rolesRoutes from './routes/roles';
import attributionRoutes from './routes/attribution';
import abtestRoutes from './routes/abtest';
import clvRoutes from './routes/clv';
import queryEditorRoutes from './routes/queryEditor';

const app: Express = express();
const PORT = process.env.API_PORT || 3001;

// ============================================
// 中间件配置
// ============================================

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://acesign.com.au']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 压缩中间件
app.use(compression());

// 日志中间件
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    userId: (req as any).userId
  });
  next();
});

// ============================================
// 路由配置
// ============================================

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 公开路由
app.use('/api/auth', authRoutes);

// 受保护的路由
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/mailerlite', authMiddleware, mailerliteRoutes);
app.use('/api/meta', authMiddleware, metaRoutes);
app.use('/api/linkedin', authMiddleware, linkedinRoutes);
app.use('/api/ga4', authMiddleware, ga4Routes);
app.use('/api/utm', authMiddleware, utmRoutes);
app.use('/api/content-calendar', authMiddleware, contentCalendarRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/roles', authMiddleware, rolesRoutes);
app.use('/api/attribution', authMiddleware, attributionRoutes);
app.use('/api/abtest', authMiddleware, abtestRoutes);
app.use('/api/clv', authMiddleware, clvRoutes);
app.use('/api/query', authMiddleware, queryEditorRoutes);

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// 错误处理中间件
app.use(errorHandler);

// ============================================
// 应用启动
// ============================================

async function startServer() {
  try {
    logger.info('Initializing ACE Sign Analytics API...', {
      environment: process.env.NODE_ENV,
      port: PORT
    });

    // 初始化数据库
    logger.info('Connecting to database...');
    await initializeDatabase();
    logger.info('Database connected successfully');

    // 初始化 Redis
    logger.info('Connecting to Redis...');
    await initializeRedis();
    logger.info('Redis connected successfully');

    // 启动定时任务调度器
    logger.info('Initializing scheduler...');
    initializeScheduler();
    logger.info('Scheduler initialized');

    // 启动服务器
    app.listen(PORT, process.env.API_HOST || '0.0.0.0', () => {
      logger.info(`✓ ACE Sign Analytics API is running`, {
        url: `http://${process.env.API_HOST || 'localhost'}:${PORT}`,
        environment: process.env.NODE_ENV || 'development'
      });
      logger.info('Available endpoints:');
      logger.info('  POST   /api/auth/login');
      logger.info('  POST   /api/auth/register');
      logger.info('  GET    /api/dashboard');
      logger.info('  GET    /api/mailerlite/campaigns');
      logger.info('  GET    /api/meta/posts');
      logger.info('  GET    /api/linkedin/posts');
      logger.info('  GET    /api/ga4/metrics');
      logger.info('  POST   /api/utm/generate');
      logger.info('  GET    /api/content-calendar');
      logger.info('  GET    /api/reports');
      logger.info('  GET    /api/analytics/summary');
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection', {
    message: reason.message,
    stack: reason.stack
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// 启动服务器
startServer();

export default app;
