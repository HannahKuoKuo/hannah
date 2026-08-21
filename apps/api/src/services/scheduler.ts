import cron from 'node-cron';
import { getDatabase } from '../utils/database';
import { initializeLogger } from '../utils/logger';
import axios from 'axios';

const logger = initializeLogger();

export function initializeScheduler() {
  // Run every minute to check for scheduled posts
  cron.schedule('* * * * *', async () => {
    try {
      await publishScheduledPosts();
      await publishScheduledMetaPosts();
      await publishScheduledLinkedInPosts();
      await sendScheduledMailerLiteCampaigns();
    } catch (error) {
      logger.error('Scheduler error', error);
    }
  });

  logger.info('Scheduler initialized');
}

async function publishScheduledPosts() {
  const db = getDatabase();

  const posts = await db('meta_posts')
    .where({ status: 'scheduled' })
    .where('scheduled_time', '<=', new Date());

  for (const post of posts) {
    try {
      const account = await db('meta_accounts')
        .where({ id: post.account_id })
        .first();

      if (!account) continue;

      // Publish via Meta Graph API
      // This is simplified - actual implementation depends on Meta API
      await db('meta_posts')
        .where({ id: post.id })
        .update({
          status: 'published',
          published_at: new Date()
        });

      logger.info(`Published Instagram post: ${post.id}`);
    } catch (error) {
      logger.error(`Failed to publish Instagram post ${post.id}`, error);
    }
  }
}

async function publishScheduledMetaPosts() {
  const db = getDatabase();

  const posts = await db('meta_posts')
    .where({ status: 'scheduled' })
    .where('scheduled_time', '<=', new Date());

  for (const post of posts) {
    try {
      await db('meta_posts')
        .where({ id: post.id })
        .update({ status: 'published', published_at: new Date() });

      logger.info(`Published Meta post: ${post.id}`);
    } catch (error) {
      logger.error(`Failed to publish Meta post ${post.id}`, error);
    }
  }
}

async function publishScheduledLinkedInPosts() {
  const db = getDatabase();

  const posts = await db('linkedin_posts')
    .where({ status: 'scheduled' })
    .where('scheduled_time', '<=', new Date());

  for (const post of posts) {
    try {
      const account = await db('linkedin_accounts')
        .where({ id: post.profile_id })
        .first();

      if (!account) continue;

      // LinkedIn publishing logic here
      await db('linkedin_posts')
        .where({ id: post.id })
        .update({
          status: 'published',
          published_at: new Date()
        });

      logger.info(`Published LinkedIn post: ${post.id}`);
    } catch (error) {
      logger.error(`Failed to publish LinkedIn post ${post.id}`, error);
    }
  }
}

async function sendScheduledMailerLiteCampaigns() {
  const db = getDatabase();

  const campaigns = await db('mailerlite_campaigns')
    .where({ status: 'scheduled' })
    .where('scheduled_for', '<=', new Date());

  for (const campaign of campaigns) {
    try {
      const account = await db('mailerlite_accounts')
        .where({ user_id: campaign.user_id })
        .first();

      if (!account) continue;

      // Send via MailerLite API
      await axios.post(
        `https://api.mailerlite.com/api/v1/campaigns/${campaign.campaign_id}/send`,
        {},
        {
          headers: {
            'X-MailerLite-ApiDomain': 'https://api.mailerlite.com',
            'X-MailerLite-ApiKey': account.api_key
          }
        }
      );

      await db('mailerlite_campaigns')
        .where({ id: campaign.id })
        .update({
          status: 'sent',
          sent_at: new Date()
        });

      logger.info(`Sent MailerLite campaign: ${campaign.campaign_id}`);
    } catch (error) {
      logger.error(`Failed to send MailerLite campaign ${campaign.campaign_id}`, error);
    }
  }
}

// Content scheduling rules
export const contentScheduleRules = {
  instagram: {
    posts: {
      frequency: 'weekly',
      count: 2,
      bestTimes: ['10:00', '19:00'] // UTC
    },
    stories: {
      frequency: '72-hourly',
      count: 1,
      bestTimes: ['12:00', '18:00']
    }
  },
  linkedin: {
    posts: {
      frequency: 'weekly',
      count: 1,
      bestTimes: ['08:00', '13:00'] // UTC
    }
  },
  newsletter: {
    frequency: 'monthly',
    count: 1,
    bestTimes: ['10:00']
  }
};

// Calculate next scheduled time based on rules
export function getNextScheduleTime(platform: string, contentType: string): Date {
  const now = new Date();

  if (platform === 'instagram' && contentType === 'story') {
    // Every 72 hours
    return new Date(now.getTime() + 72 * 60 * 60 * 1000);
  }

  if (platform === 'instagram' && contentType === 'post') {
    // 2 posts per week
    return new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);
  }

  if (platform === 'linkedin' && contentType === 'post') {
    // 1 post per week
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  if (platform === 'newsletter') {
    // 1 per month
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}
