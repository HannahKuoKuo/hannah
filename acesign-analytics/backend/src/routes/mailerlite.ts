import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../utils/database';
import { cache } from '../utils/redis';
import { logger } from '../utils/logger';
import MailerLiteAPI from '../../integrations/mailerlite';
import { subDays } from 'date-fns';

const router = Router();

router.get('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const accounts = await db('mailerlite_accounts')
      .where({ user_id: userId })
      .select('*');

    res.json({
      data: accounts,
      total: accounts.length
    });
  } catch (error) {
    logger.error('Failed to fetch MailerLite accounts', { error });
    next(error);
  }
});

router.get('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const [campaigns, total] = await Promise.all([
      db('mailerlite_campaigns')
        .where({ user_id: userId })
        .orderBy('sent_at', 'desc')
        .limit(limit)
        .offset(offset),

      db('mailerlite_campaigns')
        .where({ user_id: userId })
        .count('* as count')
        .first()
    ]);

    res.json({
      data: campaigns,
      total: (total as any)?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch campaigns', { error });
    next(error);
  }
});

router.get('/campaigns/:campaignId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { campaignId } = req.params;
    const cacheKey = `mailerlite:campaign:${campaignId}:stats`;

    const stats = await cache(cacheKey, async () => {
      const db = getDatabase();

      const [campaign, campaignStats] = await Promise.all([
        db('mailerlite_campaigns')
          .where({ id: campaignId, user_id: userId })
          .first(),

        db('mailerlite_campaign_stats')
          .where({ campaign_id: campaignId })
          .first()
      ]);

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      return {
        campaign,
        stats: campaignStats || {}
      };
    }, 600);

    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch campaign stats', { error });
    next(error);
  }
});

router.get('/subscribers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const [subscribers, total] = await Promise.all([
      db('mailerlite_subscribers')
        .where({ user_id: userId })
        .orderBy('subscribed_at', 'desc')
        .limit(limit)
        .offset(offset),

      db('mailerlite_subscribers')
        .where({ user_id: userId })
        .count('* as count')
        .first()
    ]);

    res.json({
      data: subscribers,
      total: (total as any)?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch subscribers', { error });
    next(error);
  }
});

router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const days = parseInt(req.query.days as string) || 30;
    const startDate = subDays(new Date(), days);

    const cacheKey = `mailerlite:analytics:${userId}:${days}d`;

    const analytics = await cache(cacheKey, async () => {
      const campaigns = await db('mailerlite_campaigns')
        .where({ user_id: userId })
        .whereBetween('sent_at', [startDate, new Date()]);

      const campaignIds = campaigns.map(c => c.id);

      const stats = await db('mailerlite_campaign_stats')
        .whereIn('campaign_id', campaignIds.length > 0 ? campaignIds : [-1])
        .select('*');

      return {
        totalCampaigns: campaigns.length,
        totalSent: campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0),
        avgOpenRate: stats.length > 0
          ? stats.reduce((sum, s) => sum + (s.open_rate || 0), 0) / stats.length
          : 0,
        avgClickRate: stats.length > 0
          ? stats.reduce((sum, s) => sum + (s.click_rate || 0), 0) / stats.length
          : 0,
        campaigns
      };
    }, 600);

    res.json(analytics);
  } catch (error) {
    logger.error('Failed to fetch analytics', { error });
    next(error);
  }
});

router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const accounts = await db('mailerlite_accounts')
      .where({ user_id: userId });

    logger.info(`Syncing MailerLite data for user ${userId}`);

    const results = [];
    for (const account of accounts) {
      try {
        const mailerlite = new MailerLiteAPI(account.api_token);
        const campaigns = await mailerlite.getCampaigns();
        results.push({
          accountId: account.id,
          status: 'success',
          campaignCount: campaigns.data?.length || 0
        });
      } catch (error) {
        logger.warn(`Failed to sync MailerLite account ${account.id}`, { error });
        results.push({
          accountId: account.id,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    res.json({
      message: 'MailerLite sync completed',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to sync MailerLite data', { error });
    next(error);
  }
});

export default router;
