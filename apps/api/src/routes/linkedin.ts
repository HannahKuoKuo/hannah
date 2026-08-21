import express from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../utils/database';

const router = express.Router();
const LINKEDIN_API = 'https://api.linkedin.com/v2';

// Connect LinkedIn account
router.post('/connect', async (req: AuthRequest, res) => {
  try {
    const { access_token, profile_id } = req.body;

    if (!access_token || !profile_id) {
      return res.status(400).json({
        error: 'access_token and profile_id required'
      });
    }

    const db = getDatabase();

    // Verify token with LinkedIn API
    const response = await axios.get(`${LINKEDIN_API}/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    if (!response.data.id) {
      return res.status(400).json({ error: 'Invalid access token' });
    }

    // Save connection
    await db('linkedin_accounts').insert({
      user_id: req.userId,
      profile_id,
      access_token,
      profile_name: response.data.localizedFirstName || 'LinkedIn User',
      connected_at: new Date()
    });

    res.status(201).json({
      success: true,
      profile: {
        id: response.data.id,
        name: response.data.localizedFirstName
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect LinkedIn account' });
  }
});

// Schedule LinkedIn post
router.post('/posts/schedule', async (req: AuthRequest, res) => {
  try {
    const {
      content,
      scheduled_time,
      media_url,
      profile_id
    } = req.body;

    if (!content || !scheduled_time) {
      return res.status(400).json({
        error: 'content and scheduled_time required'
      });
    }

    const db = getDatabase();

    const [post] = await db('linkedin_posts').insert({
      user_id: req.userId,
      profile_id,
      content,
      scheduled_time: new Date(scheduled_time),
      media_url,
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

// Get LinkedIn posts analytics
router.get('/posts/analytics', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    let query = db('linkedin_posts').where({ user_id: req.userId });

    if (startDate && endDate) {
      query = query.whereBetween('created_at', [
        new Date(startDate),
        new Date(endDate)
      ]);
    }

    const posts = await query.orderBy('created_at', 'desc');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Publish LinkedIn post
router.post('/posts/:post_id/publish', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { post_id } = req.params;

    const post = await db('linkedin_posts')
      .where({ user_id: req.userId, id: post_id })
      .first();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const account = await db('linkedin_accounts')
      .where({ id: post.profile_id })
      .first();

    // Call LinkedIn API to publish
    // This is simplified - actual implementation would use Person UGC API
    try {
      await axios.post(
        `${LINKEDIN_API}/ugcPosts`,
        {
          author: `urn:li:person:${account.profile_id}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: post.content
              },
              shareMediaCategory: 'ARTICLE',
              media: post.media_url ? [{
                status: 'READY',
                media: post.media_url
              }] : []
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await db('linkedin_posts')
        .where({ id: post_id })
        .update({
          status: 'published',
          published_at: new Date()
        });

      res.json({
        success: true,
        message: 'Post published successfully'
      });
    } catch (apiError: any) {
      console.error('LinkedIn API error:', apiError.response?.data);
      throw apiError;
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// Get profile insights
router.get('/insights/:profile_id', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const { profile_id } = req.params;

    const account = await db('linkedin_accounts')
      .where({ user_id: req.userId, profile_id })
      .first();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Fetch insights from LinkedIn API
    try {
      const response = await axios.get(
        `${LINKEDIN_API}/organizationalEntityAcls?q=roleAssignee`,
        {
          headers: {
            Authorization: `Bearer ${account.access_token}`
          }
        }
      );

      res.json(response.data);
    } catch (apiError) {
      return res.status(500).json({ error: 'Failed to fetch LinkedIn insights' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;
