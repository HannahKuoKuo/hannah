import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { MetaService } from '../../services/integrations/meta';
import { logger } from '../../utils/logger';
import { query } from '../../database/connection';

const router = Router();

router.get('/insights', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const config = await query(
      'SELECT meta_access_token, meta_page_id FROM user_config WHERE user_id = $1',
      [userId]
    );

    if (!config.rows[0]) {
      return res.status(404).json({ error: 'Meta configuration not found' });
    }

    const { meta_access_token, meta_page_id } = config.rows[0];
    const metaService = new MetaService(meta_access_token, meta_page_id);

    const insights = await metaService.getPageInsights();

    res.json(insights);
  } catch (error) {
    logger.error('Meta Insights Error:', error);
    res.status(500).json({ error: 'Failed to fetch Meta insights' });
  }
});

router.post('/publish', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { caption, mediaUrl } = req.body;

    const config = await query(
      'SELECT meta_access_token, meta_page_id FROM user_config WHERE user_id = $1',
      [userId]
    );

    const { meta_access_token, meta_page_id } = config.rows[0];
    const metaService = new MetaService(meta_access_token, meta_page_id);

    const result = await metaService.createPost(caption, mediaUrl);

    res.json(result);
  } catch (error) {
    logger.error('Meta Publish Error:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

export default router;
