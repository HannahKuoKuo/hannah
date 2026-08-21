import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../database/connection';
import { logger } from '../utils/logger';

const router = Router();

router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const emailMetrics = await query(
      'SELECT * FROM email_metrics WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    const socialMetrics = await query(
      'SELECT * FROM social_metrics WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    const gaMetrics = await query(
      'SELECT * FROM ga_metrics WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    res.json({
      email: emailMetrics.rows[0] || {},
      social: socialMetrics.rows[0] || {},
      ga: gaMetrics.rows[0] || {},
    });
  } catch (error) {
    logger.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/metrics', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    const metrics = await query(
      `SELECT * FROM analytics_data
       WHERE user_id = $1
       AND DATE(created_at) >= $2
       AND DATE(created_at) <= $3
       ORDER BY created_at DESC`,
      [userId, startDate, endDate]
    );

    res.json(metrics.rows);
  } catch (error) {
    logger.error('Metrics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
