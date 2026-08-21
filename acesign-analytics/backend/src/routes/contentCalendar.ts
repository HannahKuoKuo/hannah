import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../utils/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;

    let query = db('content_calendar').where({ user_id: userId });

    if (status) {
      query = query.where({ status });
    }

    const [content, total] = await Promise.all([
      query
        .orderBy('scheduled_date', 'desc')
        .limit(limit)
        .offset(offset),

      query.count('* as count').first()
    ]);

    res.json({
      data: content,
      total: (total as any)?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch content calendar', { error });
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const {
      title,
      description,
      content,
      platforms,
      scheduled_date,
      media_urls,
      hashtags
    } = req.body;

    if (!title || !content || !scheduled_date) {
      const error: AppError = new Error('Missing required fields');
      error.statusCode = 400;
      error.code = 'MISSING_FIELDS';
      throw error;
    }

    const [contentItem] = await db('content_calendar').insert({
      user_id: userId,
      title,
      description,
      content,
      platforms: platforms ? JSON.stringify(platforms) : null,
      scheduled_date: new Date(scheduled_date),
      media_urls: media_urls ? JSON.stringify(media_urls) : null,
      hashtags,
      status: 'scheduled',
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    logger.info(`Content scheduled: ${contentItem.id}`);

    res.status(201).json(contentItem);
  } catch (error) {
    logger.error('Failed to create content', { error });
    next(error);
  }
});

router.get('/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;
    const db = getDatabase();

    const content = await db('content_calendar')
      .where({ id: contentId, user_id: userId })
      .first();

    if (!content) {
      const error: AppError = new Error('Content not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    res.json(content);
  } catch (error) {
    logger.error('Failed to fetch content', { error });
    next(error);
  }
});

router.put('/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;
    const db = getDatabase();
    const {
      title,
      description,
      content,
      platforms,
      scheduled_date,
      media_urls,
      hashtags
    } = req.body;

    const existing = await db('content_calendar')
      .where({ id: contentId, user_id: userId })
      .first();

    if (!existing) {
      const error: AppError = new Error('Content not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const updated = await db('content_calendar')
      .where({ id: contentId })
      .update({
        title: title || existing.title,
        description: description || existing.description,
        content: content || existing.content,
        platforms: platforms ? JSON.stringify(platforms) : existing.platforms,
        scheduled_date: scheduled_date ? new Date(scheduled_date) : existing.scheduled_date,
        media_urls: media_urls ? JSON.stringify(media_urls) : existing.media_urls,
        hashtags: hashtags || existing.hashtags,
        updated_at: new Date()
      })
      .returning('*');

    logger.info(`Content updated: ${contentId}`);

    res.json(updated[0]);
  } catch (error) {
    logger.error('Failed to update content', { error });
    next(error);
  }
});

router.delete('/:contentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;
    const db = getDatabase();

    const existing = await db('content_calendar')
      .where({ id: contentId, user_id: userId })
      .first();

    if (!existing) {
      const error: AppError = new Error('Content not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await db('content_calendar').where({ id: contentId }).del();

    logger.info(`Content deleted: ${contentId}`);

    res.json({
      message: 'Content deleted',
      contentId
    });
  } catch (error) {
    logger.error('Failed to delete content', { error });
    next(error);
  }
});

router.post('/:contentId/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;
    const db = getDatabase();

    const content = await db('content_calendar')
      .where({ id: contentId, user_id: userId })
      .first();

    if (!content) {
      const error: AppError = new Error('Content not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await db('content_calendar')
      .where({ id: contentId })
      .update({
        status: 'published',
        published_at: new Date(),
        updated_at: new Date()
      });

    logger.info(`Content published: ${contentId}`);

    res.json({
      message: 'Content published',
      contentId,
      publishedAt: new Date()
    });
  } catch (error) {
    logger.error('Failed to publish content', { error });
    next(error);
  }
});

export default router;
