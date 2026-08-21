import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../utils/database';
import { cache } from '../utils/redis';
import { logger } from '../utils/logger';
import GA4API from '../../integrations/ga4';
import { subDays, format, startOfMonth, endOfMonth } from 'date-fns';

const router = Router();

router.get('/properties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const properties = await db('ga4_properties')
      .where({ user_id: userId })
      .select('*');

    res.json({
      data: properties,
      total: properties.length
    });
  } catch (error) {
    logger.error('Failed to fetch GA4 properties', { error });
    next(error);
  }
});

router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 30;
    const db = getDatabase();
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const cacheKey = `ga4:metrics:${userId}:${days}d`;

    const metrics = await cache(cacheKey, async () => {
      const dailyMetrics = await db('ga4_daily_metrics')
        .whereIn('property_id',
          db('ga4_properties').where({ user_id: userId }).select('id')
        )
        .whereBetween('date', [startDate, endDate])
        .orderBy('date', 'asc')
        .select('*');

      return {
        totalUsers: dailyMetrics.reduce((sum, m) => sum + (m.users || 0), 0),
        totalSessions: dailyMetrics.reduce((sum, m) => sum + (m.sessions || 0), 0),
        totalConversions: dailyMetrics.reduce((sum, m) => sum + (m.conversion_count || 0), 0),
        totalRevenue: dailyMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0),
        avgSessionDuration: dailyMetrics.length > 0
          ? dailyMetrics.reduce((sum, m) => sum + (m.avg_session_duration || 0), 0) / dailyMetrics.length
          : 0,
        bounceRate: dailyMetrics.length > 0
          ? dailyMetrics.reduce((sum, m) => sum + (m.bounce_rate || 0), 0) / dailyMetrics.length
          : 0,
        trend: dailyMetrics.map(m => ({
          date: m.date,
          users: m.users,
          sessions: m.sessions,
          revenue: m.revenue
        }))
      };
    }, 600);

    res.json(metrics);
  } catch (error) {
    logger.error('Failed to fetch GA4 metrics', { error });
    next(error);
  }
});

router.get('/traffic-sources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 30;
    const db = getDatabase();
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const cacheKey = `ga4:traffic:${userId}:${days}d`;

    const sources = await cache(cacheKey, async () => {
      const trafficData = await db('ga4_traffic_sources')
        .whereIn('property_id',
          db('ga4_properties').where({ user_id: userId }).select('id')
        )
        .whereBetween('date', [startDate, endDate])
        .select('*');

      const grouped = trafficData.reduce((acc: any, row: any) => {
        const key = row.source || 'direct';
        if (!acc[key]) {
          acc[key] = {
            source: key,
            users: 0,
            sessions: 0,
            conversions: 0,
            revenue: 0
          };
        }
        acc[key].users += row.users || 0;
        acc[key].sessions += row.sessions || 0;
        acc[key].conversions += row.conversion_count || 0;
        acc[key].revenue += row.revenue || 0;
        return acc;
      }, {});

      return {
        bySource: Object.values(grouped).sort((a: any, b: any) => b.users - a.users),
        totalSources: Object.keys(grouped).length
      };
    }, 600);

    res.json(sources);
  } catch (error) {
    logger.error('Failed to fetch traffic sources', { error });
    next(error);
  }
});

router.get('/conversions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 30;
    const db = getDatabase();
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const cacheKey = `ga4:conversions:${userId}:${days}d`;

    const conversions = await cache(cacheKey, async () => {
      const metrics = await db('ga4_daily_metrics')
        .whereIn('property_id',
          db('ga4_properties').where({ user_id: userId }).select('id')
        )
        .whereBetween('date', [startDate, endDate])
        .select('*');

      return {
        totalConversions: metrics.reduce((sum, m) => sum + (m.conversion_count || 0), 0),
        totalRevenue: metrics.reduce((sum, m) => sum + (m.revenue || 0), 0),
        conversionRate: metrics.length > 0 && metrics[0].users
          ? (metrics.reduce((sum, m) => sum + (m.conversion_count || 0), 0) /
             metrics.reduce((sum, m) => sum + (m.users || 0), 0)) * 100
          : 0,
        trend: metrics.map(m => ({
          date: m.date,
          conversions: m.conversion_count,
          revenue: m.revenue
        }))
      };
    }, 600);

    res.json(conversions);
  } catch (error) {
    logger.error('Failed to fetch conversions', { error });
    next(error);
  }
});

router.get('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const pages = await db('ga4_daily_metrics')
      .whereIn('property_id',
        db('ga4_properties').where({ user_id: userId }).select('id')
      )
      .distinct('page_path')
      .orderBy('views', 'desc')
      .limit(20)
      .select('page_path', 'views');

    res.json({
      data: pages,
      total: pages.length
    });
  } catch (error) {
    logger.error('Failed to fetch pages', { error });
    next(error);
  }
});

router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const properties = await db('ga4_properties')
      .where({ user_id: userId });

    logger.info(`Syncing GA4 data for user ${userId}`);

    res.json({
      message: 'GA4 sync initiated',
      propertiesCount: properties.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to sync GA4 data', { error });
    next(error);
  }
});

export default router;
