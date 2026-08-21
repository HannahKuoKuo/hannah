import cron from 'node-cron';
import { query } from '../database/connection';
import { logger } from '../utils/logger';
import { MetaService } from './integrations/meta';
import { MailerLiteService } from './integrations/mailerlite';
import { GA4Service } from './integrations/ga4';

export function startScheduledJobs() {
  // Sync Meta metrics every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running Meta metrics sync...');
    try {
      const configs = await query('SELECT * FROM user_config');

      for (const config of configs.rows) {
        if (config.meta_access_token && config.meta_page_id) {
          const metaService = new MetaService(
            config.meta_access_token,
            config.meta_page_id
          );
          const insights = await metaService.getPageInsights();

          await query(
            `INSERT INTO social_metrics (user_id, platform, data)
             VALUES ($1, 'meta', $2)`,
            [config.user_id, JSON.stringify(insights)]
          );
        }
      }
    } catch (error) {
      logger.error('Meta sync error:', error);
    }
  });

  // Sync Email metrics every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    logger.info('Running Email metrics sync...');
    try {
      const configs = await query('SELECT * FROM user_config');

      for (const config of configs.rows) {
        if (config.mailerlite_api_token) {
          const emailService = new MailerLiteService(config.mailerlite_api_token);
          const campaigns = await emailService.getCampaigns();

          await query(
            `INSERT INTO email_metrics (user_id, data)
             VALUES ($1, $2)`,
            [config.user_id, JSON.stringify(campaigns)]
          );
        }
      }
    } catch (error) {
      logger.error('Email sync error:', error);
    }
  });

  // Sync GA4 metrics every 3 hours
  cron.schedule('0 */3 * * *', async () => {
    logger.info('Running GA4 metrics sync...');
    try {
      const configs = await query('SELECT * FROM user_config');
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      for (const config of configs.rows) {
        if (config.ga4_property_id && config.ga4_api_key) {
          const ga4Service = new GA4Service(config.ga4_property_id, config.ga4_api_key);
          const metrics = await ga4Service.getMetrics(startDate, endDate);

          await query(
            `INSERT INTO ga_metrics (user_id, data)
             VALUES ($1, $2)`,
            [config.user_id, JSON.stringify(metrics)]
          );
        }
      }
    } catch (error) {
      logger.error('GA4 sync error:', error);
    }
  });

  // Generate daily reports at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Generating daily reports...');
    try {
      const users = await query('SELECT DISTINCT user_id FROM user_config');

      for (const user of users.rows) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        await query(
          `INSERT INTO reports (user_id, title, start_date, end_date)
           VALUES ($1, $2, $3, $4)`,
          [
            user.user_id,
            `Daily Report ${endDate}`,
            startDate,
            endDate,
          ]
        );
      }
    } catch (error) {
      logger.error('Report generation error:', error);
    }
  });

  logger.info('Scheduled jobs initialized');
}
