import express from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database';

const router = express.Router();
const GRAPH_API_VERSION = 'v18.0';
const GRAPH_API_URL = `https://graph.instagram.com/${GRAPH_API_VERSION}`;

// Connect Meta account
router.post('/connect', async (req: AuthRequest, res) => {
  try {
    const { account_id, access_token } = req.body;

    if (!account_id || !access_token) {
      return res.status(400).json({ error: 'account_id and access_token required' });
    }

    const db = getDatabase();

    // Verify token with Meta API
    const response = await axios.get(
      `${GRAPH_API_URL}/me?fields=id,name&access_token=${access_token}`
    );

    if (!response.data.id) {
      return res.status(400).json({ error: 'Invalid access token' });
    }

    // Save connection
    await db('meta_accounts').insert({
      user_id: req.userId,
      account_id,
      access_token,
      account_name: response.data.name,
      connected_at: new Date()
    });

    res.status(201).json({
      success: true,
      account: {
        id: response.data.id,
        name: response.data.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect Meta account' });
  }
});

// Get posts analytics
router.get('/posts/analytics', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const posts = await db('meta_posts')
      .where({ user_id: req.userId })
      .whereBetween('created_at', [new Date(startDate), new Date(endDate)])
      .orderBy('created_at', 'desc');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post analytics' });
  }
});

// Schedule a post
router.post('/posts/schedule', async (req: AuthRequest, res) => {
  try {
    const { content, scheduled_time, image_url } = req.body;

    if (!content || !scheduled_time) {
      return res.status(400).json({ error: 'content and scheduled_time required' });
    }

    const db = getDatabase();

    const [post] = await db('meta_posts').insert({
      user_id: req.userId,
      content,
      scheduled_time: new Date(scheduled_time),
      image_url,
      status: 'scheduled',
      created_at: new Date()
    }).returning('*');

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule post' });
  }
});

// Get account insights
router.get('/insights/:account_id', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { account_id } = req.params;

    const account = await db('meta_accounts')
      .where({ user_id: req.userId, account_id })
      .first();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Fetch from Meta API
    const response = await axios.get(
      `${GRAPH_API_URL}/${account_id}/insights`,
      {
        params: {
          metric: 'impressions,reach,profile_views,followers',
          access_token: account.access_token
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Get follower demographics
router.get('/followers/demographics/:account_id', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { account_id } = req.params;

    const demographics = await db('meta_follower_demographics')
      .where({ user_id: req.userId, account_id })
      .orderBy('created_at', 'desc')
      .first();

    res.json(demographics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demographics' });
  }
});

export default router;
