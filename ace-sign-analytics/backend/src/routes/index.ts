import { Express } from 'express';
import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import monitoringRoutes from './monitoring';
import metaRoutes from './integrations/meta';
import emailRoutes from './integrations/email';
import gaRoutes from './integrations/ga4';
import contentCalendarRoutes from './contentCalendar';
import reportsRoutes from './reports';
import utmRoutes from './utm';
import { authMiddleware } from '../middleware/auth';

export function setupRoutes(app: Express) {
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', authMiddleware, dashboardRoutes);
  app.use('/api/monitoring', authMiddleware, monitoringRoutes);
  app.use('/api/integrations/meta', authMiddleware, metaRoutes);
  app.use('/api/integrations/email', authMiddleware, emailRoutes);
  app.use('/api/integrations/ga4', authMiddleware, gaRoutes);
  app.use('/api/content-calendar', authMiddleware, contentCalendarRoutes);
  app.use('/api/reports', authMiddleware, reportsRoutes);
  app.use('/api/utm', authMiddleware, utmRoutes);
}
