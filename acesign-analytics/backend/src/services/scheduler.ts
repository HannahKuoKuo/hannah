import cron from 'node-cron';
import { logger } from '../utils/logger';
import { getDatabase } from '../utils/database';
import { getRedis, invalidateCache } from '../utils/redis';
import reportGenerator from './reportGenerator';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

export class Scheduler {
  /**
   * 初始化所有定时任务
   */
  static initializeScheduler() {
    logger.info('Initializing scheduler...');

    // 每天凌晨 2 点生成日报
    this.scheduleDailyReports();

    // 每周一晚上 8 点生成周报
    this.scheduleWeeklyReports();

    // 每月第一天生成月报
    this.scheduleMonthlyReports();

    // 每小时同步数据
    this.scheduleDataSync();

    // 每 30 分钟刷新缓存
    this.scheduleeCacheRefresh();

    // 每 5 分钟检查排程的内容
    this.scheduleContentPublishing();

    logger.info('✓ All scheduled tasks initialized');
  }

  /**
   * 每天生成日报
   */
  private static scheduleDailyReports() {
    // 每天凌晨 2 点
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Running daily report generation...');
        const db = getDatabase();
        const users = await db('users').where({ is_active: true });

        for (const user of users) {
          try {
            await reportGenerator.generateMonthlyReport(user.id);
          } catch (error) {
            logger.warn(`Failed to generate report for user ${user.id}`, { error });
          }
        }

        logger.info('Daily report generation completed');
      } catch (error) {
        logger.error('Daily report generation failed', { error });
      }
    });
  }

  /**
   * 每周生成周报
   */
  private static scheduleWeeklyReports() {
    // 每周一晚上 8 点
    cron.schedule('0 20 * * 1', async () => {
      try {
        logger.info('Running weekly report generation...');
        const db = getDatabase();
        const users = await db('users').where({ is_active: true });

        for (const user of users) {
          try {
            await reportGenerator.generateWeeklyReport(user.id);
          } catch (error) {
            logger.warn(`Failed to generate weekly report for user ${user.id}`, { error });
          }
        }

        logger.info('Weekly report generation completed');
      } catch (error) {
        logger.error('Weekly report generation failed', { error });
      }
    });
  }

  /**
   * 每月生成月报
   */
  private static scheduleMonthlyReports() {
    // 每月第一天凌晨 3 点
    cron.schedule('0 3 1 * *', async () => {
      try {
        logger.info('Running monthly report generation...');
        const db = getDatabase();
        const users = await db('users').where({ is_active: true });

        for (const user of users) {
          try {
            const report = await reportGenerator.generateMonthlyReport(user.id);

            // 尝试发送邮件
            if (user.email) {
              await this.sendReportEmail(user.email, report);
            }
          } catch (error) {
            logger.warn(`Failed to generate monthly report for user ${user.id}`, { error });
          }
        }

        logger.info('Monthly report generation completed');
      } catch (error) {
        logger.error('Monthly report generation failed', { error });
      }
    });
  }

  /**
   * 每小时同步数据
   */
  private static scheduleDataSync() {
    // 每小时整点
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running hourly data sync...');
        const db = getDatabase();

        // 同步 MailerLite 数据
        await this.syncMailerLiteData(db);

        // 同步 Meta 数据
        await this.syncMetaData(db);

        // 同步 GA4 数据
        await this.syncGA4Data(db);

        logger.info('Hourly data sync completed');
      } catch (error) {
        logger.error('Hourly data sync failed', { error });
      }
    });
  }

  /**
   * 每 30 分钟刷新缓存
   */
  private static scheduleeCacheRefresh() {
    cron.schedule('*/30 * * * *', async () => {
      try {
        logger.info('Refreshing cache...');

        // 清除仪表板缓存
        await invalidateCache('dashboard:*');

        // 清除分析缓存
        await invalidateCache('analytics:*');

        logger.info('Cache refreshed');
      } catch (error) {
        logger.error('Cache refresh failed', { error });
      }
    });
  }

  /**
   * 每 5 分钟检查排程的内容
   */
  private static scheduleContentPublishing() {
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Checking for scheduled content to publish...');
        const db = getDatabase();
        const now = new Date();

        // 查找应该发布的内容
        const scheduledContent = await db('content_calendar')
          .where('scheduled_date', '<=', now)
          .where('status', '=', 'scheduled');

        for (const content of scheduledContent) {
          try {
            // 根据平台发布内容
            await this.publishContent(content);

            // 更新状态
            await db('content_calendar')
              .where({ id: content.id })
              .update({ status: 'published', updated_at: now });

            logger.info(`Published content ${content.id}`);
          } catch (error) {
            logger.error(`Failed to publish content ${content.id}`, { error });

            // 更新失败状态
            await db('content_calendar')
              .where({ id: content.id })
              .update({ status: 'failed', updated_at: now });
          }
        }

        if (scheduledContent.length > 0) {
          logger.info(`Processed ${scheduledContent.length} scheduled items`);
        }
      } catch (error) {
        logger.error('Content publishing check failed', { error });
      }
    });
  }

  /**
   * 同步 MailerLite 数据
   */
  private static async syncMailerLiteData(db: any) {
    try {
      const accounts = await db('mailerlite_accounts');

      for (const account of accounts) {
        try {
          logger.debug(`Syncing MailerLite data for account ${account.id}`);
          // 这里会调用 MailerLite API 同步数据
          // 实现会在实际集成时添加
        } catch (error) {
          logger.warn(`Failed to sync MailerLite for account ${account.id}`, { error });
        }
      }
    } catch (error) {
      logger.error('MailerLite sync failed', { error });
    }
  }

  /**
   * 同步 Meta 数据
   */
  private static async syncMetaData(db: any) {
    try {
      const accounts = await db('meta_accounts');

      for (const account of accounts) {
        try {
          logger.debug(`Syncing Meta data for account ${account.id}`);
          // 这里会调用 Meta API 同步数据
        } catch (error) {
          logger.warn(`Failed to sync Meta for account ${account.id}`, { error });
        }
      }
    } catch (error) {
      logger.error('Meta sync failed', { error });
    }
  }

  /**
   * 同步 GA4 数据
   */
  private static async syncGA4Data(db: any) {
    try {
      const properties = await db('ga4_properties');

      for (const property of properties) {
        try {
          logger.debug(`Syncing GA4 data for property ${property.id}`);
          // 这里会调用 GA4 API 同步数据
        } catch (error) {
          logger.warn(`Failed to sync GA4 for property ${property.id}`, { error });
        }
      }
    } catch (error) {
      logger.error('GA4 sync failed', { error });
    }
  }

  /**
   * 发送报告邮件
   */
  private static async sendReportEmail(email: string, report: any) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      const mailOptions = {
        from: `ACE Sign Analytics <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Your Monthly Marketing Report - ${format(new Date(), 'MMMM YYYY')}`,
        html: `
          <h2>Your Monthly Marketing Report</h2>
          <p>Hi,</p>
          <p>Your monthly analytics report is ready! Here's a quick summary:</p>
          <ul>
            <li>Total Campaigns: ${report.data.summary.totalCampaigns}</li>
            <li>Total Social Posts: ${report.data.summary.totalSocialPosts}</li>
            <li>Total UTM Clicks: ${report.data.summary.totalUTMClicks}</li>
            <li>Website Traffic: ${report.data.summary.totalTraffic} users</li>
          </ul>
          <p><a href="${process.env.APP_URL}/reports/${report.report.id}">View Full Report</a></p>
          <p>Best regards,<br>ACE Sign Analytics Team</p>
        `
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Report email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send report email to ${email}`, { error });
    }
  }

  /**
   * 发布内容到社交媒体
   */
  private static async publishContent(content: any) {
    // 实现内容发布逻辑
    logger.debug(`Publishing content to ${content.platform}`);

    // 根据平台调用相应的 API
    switch (content.platform) {
      case 'instagram':
        // 调用 Meta API 发布到 Instagram
        break;
      case 'facebook':
        // 调用 Meta API 发布到 Facebook
        break;
      case 'linkedin':
        // 调用 LinkedIn API 发布
        break;
      case 'email':
        // 发送邮件
        break;
    }
  }
}

export function initializeScheduler() {
  Scheduler.initializeScheduler();
}

export default Scheduler;
