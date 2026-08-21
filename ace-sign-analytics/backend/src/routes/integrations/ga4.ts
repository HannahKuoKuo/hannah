import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { GA4Service } from '../../services/integrations/ga4';
import { logger } from '../../utils/logger';
import { query } from '../../database/connection';

const router = Router();

router.get('/metrics', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    const config = await query(
      'SELECT ga4_property_id, ga4_api_key FROM user_config WHERE user_id = $1',
      [userId]
    );

    if (!config.rows[0]) {
      return res.status(404).json({ error: 'GA4 configuration not found' });
    }

    const { ga4_property_id, ga4_api_key } = config.rows[0];
    const ga4Service = new GA4Service(ga4_property_id, ga4_api_key);

    const metrics = await ga4Service.getMetrics(
      startDate as string,
      endDate as string
    );

    res.json(metrics);
  } catch (error) {
    logger.error('GA4 Metrics Error:', error);
    res.status(500).json({ error: 'Failed to fetch GA4 metrics' });
  }
});

router.get('/conversions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    const config = await query(
      'SELECT ga4_property_id, ga4_api_key FROM user_config WHERE user_id = $1',
      [userId]
    );

    const { ga4_property_id, ga4_api_key } = config.rows[0];
    const ga4Service = new GA4Service(ga4_property_id, ga4_api_key);

    const conversions = await ga4Service.getConversions(
      startDate as string,
      endDate as string
    );

    res.json(conversions);
  } catch (error) {
    logger.error('GA4 Conversions Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversions' });
  }
});

export default router;
