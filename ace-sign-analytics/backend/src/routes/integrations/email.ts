import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { MailerLiteService } from '../../services/integrations/mailerlite';
import { logger } from '../../utils/logger';
import { query } from '../../database/connection';

const router = Router();

router.get('/campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const config = await query(
      'SELECT mailerlite_api_token FROM user_config WHERE user_id = $1',
      [userId]
    );

    if (!config.rows[0]) {
      return res.status(404).json({ error: 'MailerLite configuration not found' });
    }

    const { mailerlite_api_token } = config.rows[0];
    const emailService = new MailerLiteService(mailerlite_api_token);

    const campaigns = await emailService.getCampaigns();

    res.json(campaigns);
  } catch (error) {
    logger.error('Email Campaigns Error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.get('/subscribers', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const config = await query(
      'SELECT mailerlite_api_token FROM user_config WHERE user_id = $1',
      [userId]
    );

    const { mailerlite_api_token } = config.rows[0];
    const emailService = new MailerLiteService(mailerlite_api_token);

    const subscribers = await emailService.getSubscribers();

    res.json(subscribers);
  } catch (error) {
    logger.error('Subscribers Error:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

export default router;
