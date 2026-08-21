import express from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database';

const router = express.Router();
const MAILERLITE_API = 'https://api.mailerlite.com/api/v1';

// Connect MailerLite account
router.post('/connect', async (req: AuthRequest, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: 'api_key required' });
    }

    const db = getDatabase();

    // Verify API key
    try {
      await axios.get(`${MAILERLITE_API}/subscribers`, {
        headers: {
          'X-MailerLite-ApiDomain': 'https://api.mailerlite.com',
          'X-MailerLite-ApiKey': api_key
        }
      });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid API key' });
    }

    // Save connection
    await db('mailerlite_accounts').insert({
      user_id: req.userId,
      api_key,
      connected_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'MailerLite connected successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect MailerLite' });
  }
});

// Get MailerLite subscribers
router.get('/subscribers', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const account = await db('mailerlite_accounts')
      .where({ user_id: req.userId })
      .first();

    if (!account) {
      return res.status(404).json({ error: 'MailerLite account not connected' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;

    const response = await axios.get(`${MAILERLITE_API}/subscribers`, {
      headers: {
        'X-MailerLite-ApiDomain': 'https://api.mailerlite.com',
        'X-MailerLite-ApiKey': account.api_key
      },
      params: {
        limit,
        offset: (page - 1) * limit
      }
    });

    res.json({
      subscribers: response.data.data || [],
      pagination: {
        page,
        limit,
        total: response.data.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Create MailerLite campaign
router.post('/campaigns', async (req: AuthRequest, res) => {
  try {
    const { subject, content, group_id, scheduled_for } = req.body;

    if (!subject || !content || !group_id) {
      return res.status(400).json({
        error: 'subject, content, and group_id required'
      });
    }

    const db = getDatabase();
    const account = await db('mailerlite_accounts')
      .where({ user_id: req.userId })
      .first();

    if (!account) {
      return res.status(404).json({ error: 'MailerLite account not connected' });
    }

    try {
      const response = await axios.post(
        `${MAILERLITE_API}/campaigns`,
        {
          subject,
          content,
          groups: [group_id],
          type: 'regular',
          auto_workflow: false,
          scheduled_for: scheduled_for || undefined
        },
        {
          headers: {
            'X-MailerLite-ApiDomain': 'https://api.mailerlite.com',
            'X-MailerLite-ApiKey': account.api_key
          }
        }
      );

      // Save campaign record
      const [campaign] = await db('mailerlite_campaigns').insert({
        user_id: req.userId,
        campaign_id: response.data.id,
        subject,
        group_id,
        status: scheduled_for ? 'scheduled' : 'draft',
        scheduled_for: scheduled_for ? new Date(scheduled_for) : null,
        created_at: new Date()
      }).returning('*');

      res.status(201).json({
        success: true,
        campaign
      });
    } catch (apiError: any) {
      res.status(400).json({
        error: apiError.response?.data?.error?.message || 'Failed to create campaign'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get campaign stats
router.get('/campaigns/:campaign_id/stats', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { campaign_id } = req.params;

    const campaign = await db('mailerlite_campaigns')
      .where({ user_id: req.userId, campaign_id })
      .first();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const account = await db('mailerlite_accounts')
      .where({ user_id: req.userId })
      .first();

    try {
      const response = await axios.get(
        `${MAILERLITE_API}/campaigns/${campaign_id}/stats`,
        {
          headers: {
            'X-MailerLite-ApiDomain': 'https://api.mailerlite.com',
            'X-MailerLite-ApiKey': account.api_key
          }
        }
      );

      res.json({
        campaign,
        stats: response.data
      });
    } catch (apiError) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
});

// Send MailerLite campaign
router.post('/campaigns/:campaign_id/send', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { campaign_id } = req.params;

    const campaign = await db('mailerlite_campaigns')
      .where({ user_id: req.userId, campaign_id })
      .first();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const account = await db('mailerlite_accounts')
      .where({ user_id: req.userId })
      .first();

    try {
      await axios.post(
        `${MAILERLITE_API}/campaigns/${campaign_id}/send`,
        {},
        {
          headers: {
            'X-MailerLite-ApiDomain': 'https://api.mailerlite.com',
            'X-MailerLite-ApiKey': account.api_key
          }
        }
      );

      await db('mailerlite_campaigns')
        .where({ campaign_id })
        .update({
          status: 'sent',
          sent_at: new Date()
        });

      res.json({
        success: true,
        message: 'Campaign sent successfully'
      });
    } catch (apiError: any) {
      res.status(400).json({
        error: apiError.response?.data?.error?.message || 'Failed to send campaign'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

export default router;
