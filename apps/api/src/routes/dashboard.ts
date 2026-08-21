import express from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database';
import { getRedis, cache } from '../utils/redis';

const router = express.Router();

// Get dashboard overview
router.get('/overview', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const redis = getRedis();

    const overview = await cache(`dashboard:overview:${req.userId}`, async () => {
      // EDM Stats
      const edmStats = await db('edm_campaigns')
        .where({ user_id: req.userId })
        .whereBetween('sent_at', [
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        ])
        .select(
          db.raw('COUNT(*) as total_campaigns'),
          db.raw('SUM(sent_count) as total_sent'),
          db.raw('SUM(opened_count) as total_opened'),
          db.raw('SUM(clicked_count) as total_clicked')
        )
        .first();

      // Meta Stats
      const metaStats = await db('meta_posts')
        .where({ user_id: req.userId })
        .whereBetween('created_at', [
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        ])
        .select(
          db.raw('COUNT(*) as total_posts'),
          db.raw('SUM(likes) as total_likes'),
          db.raw('SUM(comments) as total_comments'),
          db.raw('SUM(shares) as total_shares')
        )
        .first();

      // Ads Stats
      const adsStats = await db('ad_campaigns')
        .where({ user_id: req.userId })
        .whereBetween('start_date', [
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        ])
        .select(
          db.raw('COUNT(*) as active_campaigns'),
          db.raw('SUM(spend) as total_spend'),
          db.raw('SUM(impressions) as total_impressions'),
          db.raw('SUM(clicks) as total_clicks'),
          db.raw('SUM(conversions) as total_conversions')
        )
        .first();

      return {
        edm: edmStats,
        meta: metaStats,
        ads: adsStats,
        timestamp: new Date()
      };
    }, 300);

    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// Get recent activities
router.get('/activities', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const activities = await db('activity_logs')
      .where({ user_id: req.userId })
      .orderBy('created_at', 'desc')
      .limit(limit);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get key metrics
router.get('/metrics', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();

    const metrics = await cache(`dashboard:metrics:${req.userId}`, async () => {
      const edmOpenRate = await db('edm_campaigns')
        .where({ user_id: req.userId })
        .select(
          db.raw('SUM(opened_count)::float / NULLIF(SUM(sent_count), 0) as rate')
        )
        .first();

      const adsRoi = await db('ad_campaigns')
        .where({ user_id: req.userId })
        .select(
          db.raw('SUM(revenue)::float / NULLIF(SUM(spend), 0) as roi')
        )
        .first();

      const metaEngagement = await db('meta_posts')
        .where({ user_id: req.userId })
        .select(
          db.raw(
            '(SUM(likes) + SUM(comments) + SUM(shares))::float / NULLIF(SUM(impressions), 0) as rate'
          )
        )
        .first();

      return {
        edm_open_rate: edmOpenRate?.rate || 0,
        ads_roi: adsRoi?.roi || 0,
        meta_engagement_rate: metaEngagement?.rate || 0
      };
    }, 600);

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
