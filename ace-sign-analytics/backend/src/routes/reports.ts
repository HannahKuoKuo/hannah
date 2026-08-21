import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../database/connection';
import { logger } from '../utils/logger';
import { generateReport } from '../services/reportGenerator';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await query(
      'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Reports Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, metrics } = req.body;

    const reportData = await generateReport(userId, startDate, endDate, metrics);

    const result = await query(
      `INSERT INTO reports (user_id, title, content, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, `Report ${new Date().toDateString()}`, JSON.stringify(reportData), startDate, endDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Generate Report Error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM reports WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Report Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

export default router;
