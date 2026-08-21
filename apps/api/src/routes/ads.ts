import express from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database';

const router = express.Router();

// Get ad campaigns
router.get('/campaigns', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const status = req.query.status as string;

    let query = db('ad_campaigns').where({ user_id: req.userId });

    if (status) {
      query = query.where({ status });
    }

    const campaigns = await query.orderBy('start_date', 'desc');

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get campaign performance
router.get('/campaigns/:campaign_id/performance', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { campaign_id } = req.params;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const campaign = await db('ad_campaigns')
      .where({ user_id: req.userId, id: campaign_id })
      .first();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get daily performance
    let query = db('ad_campaign_daily_stats')
      .where({ campaign_id });

    if (startDate && endDate) {
      query = query.whereBetween('date', [
        new Date(startDate),
        new Date(endDate)
      ]);
    }

    const dailyStats = await query
      .orderBy('date', 'desc');

    // Calculate metrics
    const totals = await db('ad_campaign_daily_stats')
      .where({ campaign_id })
      .select(
        db.raw('SUM(impressions) as total_impressions'),
        db.raw('SUM(clicks) as total_clicks'),
        db.raw('SUM(spend) as total_spend'),
        db.raw('SUM(conversions) as total_conversions'),
        db.raw('SUM(revenue) as total_revenue')
      )
      .first();

    const cpc = totals?.total_clicks ? (totals.total_spend / totals.total_clicks).toFixed(2) : 0;
    const ctr = totals?.total_impressions ? ((totals.total_clicks / totals.total_impressions) * 100).toFixed(2) : 0;
    const roas = totals?.total_spend ? (totals.total_revenue / totals.total_spend).toFixed(2) : 0;

    res.json({
      campaign,
      dailyStats,
      metrics: {
        ...totals,
        cpc,
        ctr: `${ctr}%`,
        roas
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// Create ad campaign
router.post('/campaigns', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      platform,
      budget,
      start_date,
      end_date,
      target_audience
    } = req.body;

    if (!name || !platform || !budget) {
      return res.status(400).json({
        error: 'name, platform, and budget required'
      });
    }

    const db = getDatabase();

    const [campaign] = await db('ad_campaigns').insert({
      user_id: req.userId,
      name,
      platform,
      budget,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      target_audience: JSON.stringify(target_audience),
      status: 'active',
      created_at: new Date()
    }).returning('*');

    res.status(201).json({
      success: true,
      campaign
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get conversion funnel
router.get('/funnel/:campaign_id', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { campaign_id } = req.params;

    const funnel = await db('ad_conversion_funnel')
      .where({ campaign_id })
      .orderBy('step');

    res.json(funnel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

// Get audience insights
router.get('/audience/:campaign_id', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { campaign_id } = req.params;

    const demographics = await db('ad_audience_demographics')
      .where({ campaign_id })
      .orderBy('segment');

    const interests = await db('ad_audience_interests')
      .where({ campaign_id })
      .orderBy('interest_score', 'desc')
      .limit(10);

    res.json({
      demographics,
      interests
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audience insights' });
  }
});

export default router;
