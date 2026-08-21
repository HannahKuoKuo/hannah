import { Router, Request, Response, NextFunction } from 'express';
import utmService from '../services/utmService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const {
      original_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      campaign_id,
      post_id
    } = req.body;

    if (!original_url || !utm_source || !utm_medium || !utm_campaign) {
      const error: AppError = new Error('Missing required UTM parameters');
      error.statusCode = 400;
      error.code = 'MISSING_PARAMS';
      throw error;
    }

    const link = await utmService.createUTMLink(userId, {
      original_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      campaign_id,
      post_id
    });

    res.status(201).json(link);
  } catch (error) {
    logger.error('Failed to generate UTM link', { error });
    next(error);
  }
});

router.get('/links', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await utmService.getUserUTMLinks(userId, limit, offset);
    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch UTM links', { error });
    next(error);
  }
});

router.get('/links/:linkId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { linkId } = req.params;
    const result = await utmService.getUTMLinkStats(parseInt(linkId));
    res.json(result);
  } catch (error) {
    logger.error('Failed to fetch UTM link stats', { error });
    next(error);
  }
});

router.post('/links/:linkId/click', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { linkId } = req.params;
    const {
      referrer,
      user_agent,
      ip_address,
      country,
      device_type,
      browser,
      operating_system
    } = req.body;

    await utmService.recordUTMClick(parseInt(linkId), {
      referrer,
      user_agent,
      ip_address,
      country,
      device_type,
      browser,
      operating_system
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Failed to record UTM click', { error });
    next(error);
  }
});

router.delete('/links/:linkId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { linkId } = req.params;

    await utmService.deleteUTMLink(userId, parseInt(linkId));

    res.json({
      message: 'UTM link deleted',
      linkId
    });
  } catch (error) {
    logger.error('Failed to delete UTM link', { error });
    next(error);
  }
});

router.get('/campaign/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const summary = await utmService.getUTMCampaignSummary(userId);
    res.json({
      data: summary,
      total: summary.length
    });
  } catch (error) {
    logger.error('Failed to fetch UTM campaign summary', { error });
    next(error);
  }
});

export default router;
