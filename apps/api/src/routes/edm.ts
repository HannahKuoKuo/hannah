import express from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database';

const router = express.Router();

// Get EDM campaigns
router.get('/campaigns', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;

    const campaigns = await db('edm_campaigns')
      .where({ user_id: req.userId })
      .orderBy('sent_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const total = await db('edm_campaigns')
      .where({ user_id: req.userId })
      .count('* as count')
      .first();

    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total: total?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get campaign details
router.get('/campaigns/:campaign_id', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { campaign_id } = req.params;

    const campaign = await db('edm_campaigns')
      .where({ user_id: req.userId, id: campaign_id })
      .first();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get detailed analytics
    const analytics = await db('edm_campaign_analytics')
      .where({ campaign_id })
      .select(
        db.raw('DATE(timestamp) as date'),
        db.raw('COUNT(*) as total_events'),
        db.raw('SUM(CASE WHEN event_type = "open" THEN 1 ELSE 0 END) as opens'),
        db.raw('SUM(CASE WHEN event_type = "click" THEN 1 ELSE 0 END) as clicks'),
        db.raw('SUM(CASE WHEN event_type = "bounce" THEN 1 ELSE 0 END) as bounces')
      )
      .groupBy(db.raw('DATE(timestamp)'))
      .orderBy(db.raw('DATE(timestamp)'), 'desc');

    res.json({
      campaign,
      analytics
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign details' });
  }
});

// Create EDM campaign
router.post('/campaigns', async (req: AuthRequest, res) => {
  try {
    const {
      subject,
      content,
      recipient_list,
      scheduled_time,
      template_id
    } = req.body;

    if (!subject || !content || !recipient_list) {
      return res.status(400).json({
        error: 'subject, content, and recipient_list required'
      });
    }

    const db = getDatabase();

    const [campaign] = await db('edm_campaigns').insert({
      user_id: req.userId,
      subject,
      content,
      recipient_list: JSON.stringify(recipient_list),
      template_id,
      scheduled_time: scheduled_time ? new Date(scheduled_time) : null,
      status: 'draft',
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

// Send EDM campaign
router.post('/campaigns/:campaign_id/send', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { campaign_id } = req.params;

    const campaign = await db('edm_campaigns')
      .where({ user_id: req.userId, id: campaign_id })
      .first();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Send via email provider (Mailchimp or SendGrid)
    // This is a simplified example
    const recipients = JSON.parse(campaign.recipient_list);

    await db('edm_campaigns')
      .where({ id: campaign_id })
      .update({
        status: 'sent',
        sent_at: new Date(),
        sent_count: recipients.length
      });

    // Log activity
    await db('activity_logs').insert({
      user_id: req.userId,
      action: 'edm_campaign_sent',
      details: JSON.stringify({ campaign_id }),
      created_at: new Date()
    });

    res.json({
      success: true,
      message: 'Campaign sent successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

// Get subscriber list
router.get('/subscribers', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;

    const subscribers = await db('edm_subscribers')
      .where({ user_id: req.userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const total = await db('edm_subscribers')
      .where({ user_id: req.userId })
      .count('* as count')
      .first();

    res.json({
      subscribers,
      pagination: {
        page,
        limit,
        total: total?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Add subscriber
router.post('/subscribers', async (req: AuthRequest, res) => {
  try {
    const { email, name, tags } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const db = getDatabase();

    const [subscriber] = await db('edm_subscribers').insert({
      user_id: req.userId,
      email,
      name,
      tags: tags ? JSON.stringify(tags) : null,
      status: 'active',
      created_at: new Date()
    }).returning('*');

    res.status(201).json({
      success: true,
      subscriber
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add subscriber' });
  }
});

export default router;
