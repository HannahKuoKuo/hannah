import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../utils/database';
import { cache } from '../utils/redis';
import { logger } from '../utils/logger';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

const router = Router();

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 30;
    const cacheKey = `analytics:summary:${userId}:${days}d`;

    const summary = await cache(cacheKey, async () => {
      const db = getDatabase();
      const now = new Date();
      const startDate = subDays(now, days);

      const [
        emailStats,
        socialStats,
        utmStats,
        gaStats
      ] = await Promise.all([
        getEmailStats(db, userId, startDate, now),
        getSocialStats(db, userId, startDate, now),
        getUTMStats(db, userId, startDate, now),
        getGAStats(db, userId, startDate, now)
      ]);

      return {
        period: `${days} days`,
        email: emailStats,
        social: socialStats,
        utm: utmStats,
        ga: gaStats,
        timestamp: new Date().toISOString()
      };
    }, 600);

    res.json(summary);
  } catch (error) {
    logger.error('Failed to fetch analytics summary', { error });
    next(error);
  }
});

router.get('/comparison', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const cacheKey = `analytics:comparison:${userId}`;

    const comparison = await cache(cacheKey, async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const prevMonthStart = subDays(monthStart, 30);
      const prevMonthEnd = subDays(monthStart, 1);

      const [currentMonth, previousMonth] = await Promise.all([
        getMonthlyMetrics(db, userId, monthStart, monthEnd),
        getMonthlyMetrics(db, userId, prevMonthStart, prevMonthEnd)
      ]);

      return {
        currentMonth,
        previousMonth,
        growth: {
          email: calculateGrowth(currentMonth.email.totalCampaigns, previousMonth.email.totalCampaigns),
          social: calculateGrowth(currentMonth.social.totalPosts, previousMonth.social.totalPosts),
          utm: calculateGrowth(currentMonth.utm.clicks, previousMonth.utm.clicks),
          ga: calculateGrowth(currentMonth.ga.users, previousMonth.ga.users)
        }
      };
    }, 600);

    res.json(comparison);
  } catch (error) {
    logger.error('Failed to fetch analytics comparison', { error });
    next(error);
  }
});

router.get('/channels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 30;
    const db = getDatabase();
    const cacheKey = `analytics:channels:${userId}:${days}d`;

    const channels = await cache(cacheKey, async () => {
      const startDate = subDays(new Date(), days);
      const now = new Date();

      const [email, social, utm, direct] = await Promise.all([
        db('mailerlite_campaigns')
          .where({ user_id: userId })
          .whereBetween('sent_at', [startDate, now])
          .count('* as count')
          .first(),

        db('meta_posts')
          .where({ user_id: userId })
          .whereBetween('published_at', [startDate, now])
          .sum('likes as likes')
          .sum('comments as comments')
          .first(),

        db('utm_click_events')
          .whereIn('utm_link_id',
            db('utm_links').where({ user_id: userId }).select('id')
          )
          .whereBetween('clicked_at', [startDate, now])
          .count('* as count')
          .first(),

        db('ga4_daily_metrics')
          .whereIn('property_id',
            db('ga4_properties').where({ user_id: userId }).select('id')
          )
          .whereBetween('date', [startDate, now])
          .sum('users as count')
          .first()
      ]);

      const emailCount = (email as any)?.count || 0;
      const socialEngagement = ((social as any)?.likes || 0) + ((social as any)?.comments || 0);
      const utmCount = (utm as any)?.count || 0;
      const directUsers = (direct as any)?.count || 0;

      return [
        {
          channel: 'Email (MailerLite)',
          engagement: emailCount,
          percentage: 0
        },
        {
          channel: 'Social Media',
          engagement: socialEngagement,
          percentage: 0
        },
        {
          channel: 'UTM Tracking',
          engagement: utmCount,
          percentage: 0
        },
        {
          channel: 'Direct Traffic',
          engagement: directUsers,
          percentage: 0
        }
      ].map(ch => ({
        ...ch,
        percentage: emailCount + socialEngagement + utmCount + directUsers > 0
          ? (ch.engagement / (emailCount + socialEngagement + utmCount + directUsers)) * 100
          : 0
      }));
    }, 600);

    res.json({
      data: channels,
      total: channels.length
    });
  } catch (error) {
    logger.error('Failed to fetch channels analytics', { error });
    next(error);
  }
});

router.get('/roi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const days = parseInt(req.query.days as string) || 30;
    const db = getDatabase();
    const cacheKey = `analytics:roi:${userId}:${days}d`;

    const roi = await cache(cacheKey, async () => {
      const startDate = subDays(new Date(), days);
      const now = new Date();

      const gaMetrics = await db('ga4_daily_metrics')
        .whereIn('property_id',
          db('ga4_properties').where({ user_id: userId }).select('id')
        )
        .whereBetween('date', [startDate, now])
        .select('*');

      const totalRevenue = gaMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
      const totalUsers = gaMetrics.reduce((sum, m) => sum + (m.users || 0), 0);
      const totalConversions = gaMetrics.reduce((sum, m) => sum + (m.conversion_count || 0), 0);

      return {
        totalRevenue,
        totalUsers,
        totalConversions,
        conversionRate: totalUsers > 0 ? (totalConversions / totalUsers) * 100 : 0,
        revenuePerUser: totalUsers > 0 ? totalRevenue / totalUsers : 0,
        revenuePerConversion: totalConversions > 0 ? totalRevenue / totalConversions : 0
      };
    }, 600);

    res.json(roi);
  } catch (error) {
    logger.error('Failed to fetch ROI analytics', { error });
    next(error);
  }
});

async function getEmailStats(db: any, userId: number, startDate: Date, endDate: Date) {
  const campaigns = await db('mailerlite_campaigns')
    .where({ user_id: userId })
    .whereBetween('sent_at', [startDate, endDate])
    .count('* as count')
    .first();

  return {
    totalCampaigns: (campaigns as any)?.count || 0
  };
}

async function getSocialStats(db: any, userId: number, startDate: Date, endDate: Date) {
  const posts = await db('meta_posts')
    .where({ user_id: userId })
    .whereBetween('published_at', [startDate, endDate])
    .count('* as count')
    .first();

  const engagement = await db('meta_posts')
    .where({ user_id: userId })
    .whereBetween('published_at', [startDate, endDate])
    .sum('likes as likes')
    .sum('comments as comments')
    .sum('shares as shares')
    .first();

  return {
    totalPosts: (posts as any)?.count || 0,
    engagement: ((engagement as any)?.likes || 0) + ((engagement as any)?.comments || 0) + ((engagement as any)?.shares || 0)
  };
}

async function getUTMStats(db: any, userId: number, startDate: Date, endDate: Date) {
  const clicks = await db('utm_click_events')
    .whereIn('utm_link_id',
      db('utm_links').where({ user_id: userId }).select('id')
    )
    .whereBetween('clicked_at', [startDate, endDate])
    .count('* as count')
    .first();

  return {
    clicks: (clicks as any)?.count || 0
  };
}

async function getGAStats(db: any, userId: number, startDate: Date, endDate: Date) {
  const metrics = await db('ga4_daily_metrics')
    .whereIn('property_id',
      db('ga4_properties').where({ user_id: userId }).select('id')
    )
    .whereBetween('date', [startDate, endDate])
    .select('*');

  return {
    users: metrics.reduce((sum, m) => sum + (m.users || 0), 0),
    sessions: metrics.reduce((sum, m) => sum + (m.sessions || 0), 0),
    conversions: metrics.reduce((sum, m) => sum + (m.conversion_count || 0), 0),
    revenue: metrics.reduce((sum, m) => sum + (m.revenue || 0), 0)
  };
}

async function getMonthlyMetrics(db: any, userId: number, startDate: Date, endDate: Date) {
  const email = await getEmailStats(db, userId, startDate, endDate);
  const social = await getSocialStats(db, userId, startDate, endDate);
  const utm = await getUTMStats(db, userId, startDate, endDate);
  const ga = await getGAStats(db, userId, startDate, endDate);

  return { email, social: { totalPosts: social.totalPosts }, utm, ga };
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default router;
