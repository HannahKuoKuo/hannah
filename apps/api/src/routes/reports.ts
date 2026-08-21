import express from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database';
import { generatePDFReport } from '../services/reportGenerator';

const router = express.Router();

// Get available reports
router.get('/', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();

    const reports = await db('reports')
      .where({ user_id: req.userId })
      .orderBy('created_at', 'desc');

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Generate monthly report
router.post('/generate/monthly', async (req: AuthRequest, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'month and year required' });
    }

    const db = getDatabase();

    // Gather data for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // EDM data
    const edmData = await db('edm_campaigns')
      .where({ user_id: req.userId })
      .whereBetween('sent_at', [startDate, endDate]);

    // Meta data
    const metaData = await db('meta_posts')
      .where({ user_id: req.userId })
      .whereBetween('created_at', [startDate, endDate]);

    // Ads data
    const adsData = await db('ad_campaigns')
      .where({ user_id: req.userId })
      .whereBetween('start_date', [startDate, endDate]);

    const reportData = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      edm: {
        campaigns_sent: edmData.length,
        total_recipients: edmData.reduce((sum: number, c: any) => sum + (c.sent_count || 0), 0),
        avg_open_rate: edmData.length > 0
          ? (edmData.reduce((sum: number, c: any) => sum + ((c.opened_count || 0) / (c.sent_count || 1)), 0) / edmData.length * 100).toFixed(2)
          : 0,
        avg_click_rate: edmData.length > 0
          ? (edmData.reduce((sum: number, c: any) => sum + ((c.clicked_count || 0) / (c.sent_count || 1)), 0) / edmData.length * 100).toFixed(2)
          : 0
      },
      meta: {
        total_posts: metaData.length,
        total_engagement: metaData.reduce((sum: number, p: any) => sum + ((p.likes || 0) + (p.comments || 0) + (p.shares || 0)), 0),
        avg_likes: metaData.length > 0 ? (metaData.reduce((sum: number, p: any) => sum + (p.likes || 0), 0) / metaData.length).toFixed(2) : 0,
        avg_comments: metaData.length > 0 ? (metaData.reduce((sum: number, p: any) => sum + (p.comments || 0), 0) / metaData.length).toFixed(2) : 0
      },
      ads: {
        active_campaigns: adsData.length,
        total_spend: adsData.reduce((sum: number, c: any) => sum + (c.spend || 0), 0).toFixed(2),
        total_impressions: adsData.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0),
        total_conversions: adsData.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0),
        avg_roi: adsData.length > 0
          ? (adsData.reduce((sum: number, c: any) => sum + ((c.revenue || 0) / (c.spend || 1)), 0) / adsData.length).toFixed(2)
          : 0
      }
    };

    // Save report
    const [report] = await db('reports').insert({
      user_id: req.userId,
      type: 'monthly',
      period: `${year}-${String(month).padStart(2, '0')}`,
      data: JSON.stringify(reportData),
      created_at: new Date()
    }).returning('*');

    res.status(201).json({
      success: true,
      report: {
        ...report,
        data: reportData
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Export report as PDF
router.get('/:report_id/export/pdf', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { report_id } = req.params;

    const report = await db('reports')
      .where({ user_id: req.userId, id: report_id })
      .first();

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const pdfBuffer = await generatePDFReport(report);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${report.period}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// Schedule report
router.post('/schedule', async (req: AuthRequest, res) => {
  try {
    const { frequency, recipient_email, report_type } = req.body;

    if (!frequency || !recipient_email) {
      return res.status(400).json({
        error: 'frequency and recipient_email required'
      });
    }

    const db = getDatabase();

    const [schedule] = await db('scheduled_reports').insert({
      user_id: req.userId,
      frequency,
      report_type: report_type || 'monthly',
      recipient_email,
      is_active: true,
      created_at: new Date()
    }).returning('*');

    res.status(201).json({
      success: true,
      schedule
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule report' });
  }
});

export default router;
