import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../database/connection';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { month, year } = req.query;

    const result = await query(
      `SELECT * FROM content_calendar
       WHERE user_id = $1
       AND EXTRACT(MONTH FROM scheduled_date) = $2
       AND EXTRACT(YEAR FROM scheduled_date) = $3
       ORDER BY scheduled_date ASC`,
      [userId, month, year]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Content Calendar Error:', error);
    res.status(500).json({ error: 'Failed to fetch content calendar' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, content, platform, scheduledDate, mediaUrl } = req.body;

    const result = await query(
      `INSERT INTO content_calendar
       (user_id, title, content, platform, scheduled_date, media_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, title, content, platform, scheduledDate, mediaUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create Content Error:', error);
    res.status(500).json({ error: 'Failed to create content' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, platform, scheduledDate, mediaUrl } = req.body;

    const result = await query(
      `UPDATE content_calendar
       SET title = $1, content = $2, platform = $3,
           scheduled_date = $4, media_url = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, content, platform, scheduledDate, mediaUrl, id, req.user?.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update Content Error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await query(
      'DELETE FROM content_calendar WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete Content Error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

export default router;
