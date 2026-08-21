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

    const accounts = await db('meta_accounts')
      .where({ user_id: userId })
      .select('*');

    res.json({
      data: accounts,
      total: accounts.length
    });
  } catch (error) {
    logger.error('Failed to fetch Meta accounts', { error });
    next(error);
  }
});

router.get('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const platform = req.query.platform as string;

    let query = db('meta_posts').where({ user_id: userId });

    if (platform) {
      query = query.where({ platform });
    }

    const [posts, total] = await Promise.all([
      query
        .orderBy('published_at', 'desc')
        .limit(limit)
        .offset(offset),

      query.count('* as count').first()
    ]);

    res.json({
      data: posts,
      total: (total as any)?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch Meta posts', { error });
    next(error);
  }
});

router.get('/posts/:postId/insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const cacheKey = `meta:post:${postId}:insights`;

    const insights = await cache(cacheKey, async () => {
      const db = getDatabase();

      const post = await db('meta_posts')
        .where({ id: postId, user_id: userId })
        .first();

      if (!post) {
        throw new Error('Post not found');
      }

      const stats = await db('meta_post_stats')
        .where({ post_id: postId })
        .first();

      return {
        post,
        stats: stats || {},
        engagement: {
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          engagement_rate: post.engagement_rate || 0
        }
      };
    }, 600);

    res.json(insights);
  } catch (error) {
    logger.error('Failed to fetch post insights', { error });
    next(error);
  }
});

router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const days = parseInt(req.query.days as string) || 30;
    const startDate = subDays(new Date(), days);

    const cacheKey = `meta:analytics:${userId}:${days}d`;

    const analytics = await cache(cacheKey, async () => {
      const posts = await db('meta_posts')
        .where({ user_id: userId })
        .whereBetween('published_at', [startDate, new Date()]);

      const stats = await db('meta_post_stats')
        .whereIn('post_id', posts.map(p => p.id).length > 0 ? posts.map(p => p.id) : [-1])
        .select('*');

      const totalEngagement = posts.reduce((sum, p) =>
        sum + ((p.likes || 0) + (p.comments || 0) + (p.shares || 0)), 0
      );

      return {
        totalPosts: posts.length,
        totalEngagement,
        avgEngagementPerPost: posts.length > 0 ? totalEngagement / posts.length : 0,
        topPosts: posts
          .sort((a, b) => ((b.likes || 0) + (b.comments || 0) + (b.shares || 0)) - ((a.likes || 0) + (a.comments || 0) + (a.shares || 0)))
          .slice(0, 5),
        byPlatform: {
          instagram: posts.filter(p => p.platform === 'instagram').length,
          facebook: posts.filter(p => p.platform === 'facebook').length
        }
      };
    }, 600);

    res.json(analytics);
  } catch (error) {
    logger.error('Failed to fetch Meta analytics', { error });
    next(error);
  }
});

router.get('/followers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const demographics = await db('meta_follower_demographics')
      .where({ user_id: userId })
      .select('*');

    res.json({
      data: demographics,
      total: demographics.length
    });
  } catch (error) {
    logger.error('Failed to fetch follower demographics', { error });
    next(error);
  }
});

router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const accounts = await db('meta_accounts')
      .where({ user_id: userId });

    logger.info(`Syncing Meta data for user ${userId}`);

    res.json({
      message: 'Meta sync initiated',
      accountsCount: accounts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to sync Meta data', { error });
    next(error);
  }
});

export default router;
