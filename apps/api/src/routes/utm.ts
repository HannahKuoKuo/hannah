import express from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database';

const router = express.Router();

// Generate UTM link
router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const {
      base_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term
    } = req.body;

    if (!base_url || !utm_source || !utm_medium || !utm_campaign) {
      return res.status(400).json({
        error: 'base_url, utm_source, utm_medium, utm_campaign required'
      });
    }

    // Generate UTM link
    const urlObj = new URL(base_url);
    urlObj.searchParams.append('utm_source', utm_source);
    urlObj.searchParams.append('utm_medium', utm_medium);
    urlObj.searchParams.append('utm_campaign', utm_campaign);

    if (utm_content) {
      urlObj.searchParams.append('utm_content', utm_content);
    }
    if (utm_term) {
      urlObj.searchParams.append('utm_term', utm_term);
    }

    const utmLink = urlObj.toString();

    // Save to database
    const db = getDatabase();
    const [record] = await db('utm_links').insert({
      user_id: req.userId,
      base_url,
      utm_link: utmLink,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      clicks: 0,
      created_at: new Date()
    }).returning('*');

    res.status(201).json({
      success: true,
      utm_link: utmLink,
      short_code: record.id,
      full_record: record
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate UTM link' });
  }
});

// Get UTM links
router.get('/', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;

    const links = await db('utm_links')
      .where({ user_id: req.userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const total = await db('utm_links')
      .where({ user_id: req.userId })
      .count('* as count')
      .first();

    res.json({
      links,
      pagination: {
        page,
        limit,
        total: total?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch UTM links' });
  }
});

// Get UTM link performance
router.get('/:link_id/performance', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { link_id } = req.params;

    const link = await db('utm_links')
      .where({ user_id: req.userId, id: link_id })
      .first();

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Get click data
    const dailyClicks = await db('utm_click_events')
      .where({ utm_link_id: link_id })
      .select(
        db.raw('DATE(timestamp) as date'),
        db.raw('COUNT(*) as clicks'),
        db.raw('COUNT(DISTINCT user_agent) as unique_visitors')
      )
      .groupBy(db.raw('DATE(timestamp)'))
      .orderBy(db.raw('DATE(timestamp)'), 'desc');

    const topReferrers = await db('utm_click_events')
      .where({ utm_link_id: link_id })
      .select('referrer')
      .count('* as count')
      .groupBy('referrer')
      .orderBy('count', 'desc')
      .limit(5);

    res.json({
      link,
      dailyClicks,
      topReferrers,
      totalClicks: link.clicks
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// Track UTM click
router.post('/:link_id/track', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { link_id } = req.params;
    const { referrer, user_agent } = req.body;

    // Update click count
    await db('utm_links').where({ id: link_id }).increment('clicks', 1);

    // Log click event
    await db('utm_click_events').insert({
      utm_link_id: link_id,
      referrer,
      user_agent,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track click' });
  }
});

export default router;
