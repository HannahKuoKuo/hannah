import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../utils/database';
import { cache } from '../utils/redis';
import { logger } from '../utils/logger';
import { subDays } from 'date-fns';

const router = Router();

router.get('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const accounts = await db('linkedin_accounts')
      .where({ user_id: userId })
      .select('*');

    res.json({
      data: accounts,
      total: accounts.length
    });
  } catch (error) {
    logger.error('Failed to fetch LinkedIn accounts', { error });
    next(error);
  }
});

router.get('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const [posts, total] = await Promise.all([
      db('linkedin_posts')
        .where({ user_id: userId })
        .orderBy('published_at', 'desc')
        .limit(limit)
        .offset(offset),

      db('linkedin_posts')
        .where({ user_id: userId })
        .count('* as count')
        .first()
    ]);

    res.json({
      data: posts,
      total: (total as any)?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch LinkedIn posts', { error });
    next(error);
  }
});

router.get('/posts/:postId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const cacheKey = `linkedin:post:${postId}:stats`;

    const stats = await cache(cacheKey, async () => {
      const db = getDatabase();

      const post = await db('linkedin_posts')
        .where({ id: postId, user_id: userId })
        .first();

      if (!post) {
        throw new Error('Post not found');
      }

      const postStats = await db('linkedin_post_stats')
        .where({ post_id: postId })
        .first();

      return {
        post,
        stats: postStats || {},
        engagement: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          engagement_count: post.engagement_count || 0
        }
      };
    }, 600);

    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch LinkedIn post stats', { error });
    next(error);
  }
});

router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const days = parseInt(req.query.days as string) || 30;
    const startDate = subDays(new Date(), days);

    const cacheKey = `linkedin:analytics:${userId}:${days}d`;

    const analytics = await cache(cacheKey, async () => {
      const posts = await db('linkedin_posts')
        .where({ user_id: userId })
        .whereBetween('published_at', [startDate, new Date()]);

      const totalEngagement = posts.reduce((sum, p) =>
        sum + (p.engagement_count || 0), 0
      );

      return {
        totalPosts: posts.length,
        totalEngagement,
        avgEngagementPerPost: posts.length > 0 ? totalEngagement / posts.length : 0,
        topPosts: posts
          .sort((a, b) => (b.engagement_count || 0) - (a.engagement_count || 0))
          .slice(0, 5),
        engagementTrend: posts.map(p => ({
          date: p.published_at,
          engagement: p.engagement_count
        }))
      };
    }, 600);

    res.json(analytics);
  } catch (error) {
    logger.error('Failed to fetch LinkedIn analytics', { error });
    next(error);
  }
});

router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const accounts = await db('linkedin_accounts')
      .where({ user_id: userId });

    logger.info(`Syncing LinkedIn data for user ${userId}`);

    res.json({
      message: 'LinkedIn sync initiated',
      accountsCount: accounts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to sync LinkedIn data', { error });
    next(error);
  }
});

export default router;
