import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../utils/database';
import { getRedis, cache, invalidateCache } from '../utils/redis';
import { logger } from '../utils/logger';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const cacheKey = `dashboard:${userId}`;

    const cachedData = await cache(cacheKey, async () => {
      const db = getDatabase();
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const [
        mailerliteCampaigns,
        metaPosts,
        linkedinPosts,
        utmLinks,
        utmClicks,
        gaUsers,
        gaRevenue,
        reports
      ] = await Promise.all([
        db('mailerlite_campaigns')
          .where({ user_id: userId })
          .whereBetween('sent_at', [thirtyDaysAgo, now])
          .count('* as count')
          .first(),

        db('meta_posts')
          .where({ user_id: userId })
          .whereBetween('published_at', [thirtyDaysAgo, now])
          .sum('likes as total_likes')
          .sum('comments as total_comments')
          .first(),

        db('linkedin_posts')
          .where({ user_id: userId })
          .whereBetween('published_at', [thirtyDaysAgo, now])
          .sum('engagement_count as total_engagement')
          .first(),

        db('utm_links')
          .where({ user_id: userId })
          .count('* as count')
          .first(),

        db('utm_click_events')
          .whereIn('utm_link_id',
            db('utm_links').where({ user_id: userId }).select('id')
          )
          .whereBetween('clicked_at', [thirtyDaysAgo, now])
          .count('* as count')
          .first(),

        db('ga4_daily_metrics')
          .whereIn('property_id',
            db('ga4_properties').where({ user_id: userId }).select('id')
          )
          .whereBetween('date', [monthStart, monthEnd])
          .sum('users as total')
          .first(),

        db('ga4_daily_metrics')
          .whereIn('property_id',
            db('ga4_properties').where({ user_id: userId }).select('id')
          )
          .whereBetween('date', [monthStart, monthEnd])
          .sum('revenue as total')
          .first(),

        db('reports')
          .where({ user_id: userId })
          .orderBy('generated_at', 'desc')
          .limit(5)
      ]);

      return {
        summary: {
          emailCampaigns: (mailerliteCampaigns as any)?.count || 0,
          socialEngagement: {
            meta: {
              likes: (metaPosts as any)?.total_likes || 0,
              comments: (metaPosts as any)?.total_comments || 0
            },
            linkedin: {
              engagement: (linkedinPosts as any)?.total_engagement || 0
            }
          },
          utm: {
            links: (utmLinks as any)?.count || 0,
            clicks: (utmClicks as any)?.count || 0
          },
          analytics: {
            users: (gaUsers as any)?.total || 0,
            revenue: (gaRevenue as any)?.total || 0
          }
        },
        recentReports: reports,
        period: '30 days',
        lastUpdated: new Date().toISOString()
      };
    }, 300); // Cache for 5 minutes

    res.json(cachedData);
  } catch (error) {
    logger.error('Failed to fetch dashboard', { error });
    next(error);
  }
});

router.get('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const cacheKey = `dashboard:${userId}`;

    await invalidateCache(cacheKey);

    res.json({
      message: 'Dashboard cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to refresh dashboard cache', { error });
    next(error);
  }
});

export default router;
