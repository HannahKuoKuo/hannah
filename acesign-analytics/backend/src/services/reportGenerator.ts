import PDFDocument from 'pdfkit';
import { getDatabase } from '../utils/database';
import { logger } from '../utils/logger';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import fs from 'fs';
import path from 'path';

export class ReportGenerator {
  /**
   * 生成月度报告
   */
  async generateMonthlyReport(userId: number, date: Date = new Date()) {
    try {
      const db = getDatabase();
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);

      logger.info(`Generating monthly report for user ${userId}`, {
        month: format(date, 'YYYY-MM')
      });

      // 收集数据
      const [
        edmCampaigns,
        metaPosts,
        linkedinPosts,
        utmStats,
        gaMetrics
      ] = await Promise.all([
        this.getEDMCampaignStats(userId, startDate, endDate),
        this.getMetaPostStats(userId, startDate, endDate),
        this.getLinkedInPostStats(userId, startDate, endDate),
        this.getUTMStats(userId, startDate, endDate),
        this.getGAMetrics(userId, startDate, endDate)
      ]);

      // 生成报告数据
      const reportData = {
        period: format(startDate, 'YYYY-MM'),
        generatedAt: new Date(),
        summary: {
          totalCampaigns: edmCampaigns.length,
          totalSocialPosts: (metaPosts.length || 0) + (linkedinPosts.length || 0),
          totalUTMClicks: utmStats.totalClicks,
          totalTraffic: gaMetrics.totalUsers
        },
        edm: {
          campaigns: edmCampaigns,
          totalSent: edmCampaigns.reduce((sum: number, c: any) => sum + (c.sent_count || 0), 0),
          avgOpenRate: this.calculateAverage(edmCampaigns.map((c: any) => c.open_rate || 0)),
          avgClickRate: this.calculateAverage(edmCampaigns.map((c: any) => c.click_rate || 0))
        },
        social: {
          instagram: metaPosts,
          linkedin: linkedinPosts,
          totalEngagement: metaPosts.reduce((sum: number, p: any) =>
            sum + ((p.likes || 0) + (p.comments || 0) + (p.shares || 0)), 0
          )
        },
        utm: utmStats,
        analytics: gaMetrics
      };

      // 保存报告到数据库
      const [report] = await db('reports').insert({
        user_id: userId,
        report_type: 'monthly',
        period_start: startDate,
        period_end: endDate,
        title: `Monthly Report - ${format(startDate, 'MMMM YYYY')}`,
        data: JSON.stringify(reportData),
        generated_at: new Date()
      }).returning('*');

      logger.info(`Monthly report generated successfully for user ${userId}`, {
        reportId: report.id
      });

      return { report, data: reportData };
    } catch (error) {
      logger.error(`Failed to generate monthly report for user ${userId}`, { error });
      throw error;
    }
  }

  /**
   * 生成周度报告
   */
  async generateWeeklyReport(userId: number, date: Date = new Date()) {
    try {
      const startDate = subDays(date, 7);
      const endDate = new Date(date);

      logger.info(`Generating weekly report for user ${userId}`, {
        week: format(startDate, 'YYYY-MM-DD') + ' to ' + format(endDate, 'YYYY-MM-DD')
      });

      const db = getDatabase();

      // 收集数据
      const [edmCampaigns, metaPosts, utmStats] = await Promise.all([
        this.getEDMCampaignStats(userId, startDate, endDate),
        this.getMetaPostStats(userId, startDate, endDate),
        this.getUTMStats(userId, startDate, endDate)
      ]);

      const reportData = {
        period: `Week of ${format(startDate, 'YYYY-MM-DD')}`,
        generatedAt: new Date(),
        edm: {
          campaignsSent: edmCampaigns.length,
          avgOpenRate: this.calculateAverage(edmCampaigns.map((c: any) => c.open_rate || 0))
        },
        social: {
          postsPublished: metaPosts.length,
          totalEngagement: metaPosts.reduce((sum: number, p: any) =>
            sum + ((p.likes || 0) + (p.comments || 0) + (p.shares || 0)), 0
          )
        },
        utm: utmStats
      };

      const [report] = await db('reports').insert({
        user_id: userId,
        report_type: 'weekly',
        period_start: startDate,
        period_end: endDate,
        title: `Weekly Report - ${format(startDate, 'MMM dd, YYYY')}`,
        data: JSON.stringify(reportData),
        generated_at: new Date()
      }).returning('*');

      logger.info(`Weekly report generated for user ${userId}`, { reportId: report.id });
      return { report, data: reportData };
    } catch (error) {
      logger.error(`Failed to generate weekly report for user ${userId}`, { error });
      throw error;
    }
  }

  /**
   * 生成 PDF 报告文件
   */
  async generatePDFReport(userId: number, reportId: number) {
    try {
      const db = getDatabase();
      const report = await db('reports').where({ id: reportId, user_id: userId }).first();

      if (!report) {
        throw new Error('Report not found');
      }

      const data = JSON.parse(report.data);
      const filePath = path.join(process.cwd(), 'reports', `report-${reportId}.pdf`);

      // 创建报告目录
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // 创建 PDF 文档
      const doc = new PDFDocument({ size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // 标题
      doc.fontSize(24).font('Helvetica-Bold').text('ACE Sign Analytics Report', 50, 50);
      doc.fontSize(12).font('Helvetica').text(`Period: ${report.title}`, 50, 90);

      // 摘要部分
      doc.fontSize(16).font('Helvetica-Bold').text('Summary', 50, 140);
      if (data.summary) {
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total Campaigns: ${data.summary.totalCampaigns}`, 50, 170);
        doc.text(`Total Social Posts: ${data.summary.totalSocialPosts}`, 50, 190);
        doc.text(`Total UTM Clicks: ${data.summary.totalUTMClicks}`, 50, 210);
        doc.text(`Total Website Traffic: ${data.summary.totalTraffic}`, 50, 230);
      }

      // EDM 部分
      doc.fontSize(16).font('Helvetica-Bold').text('Email Marketing (EDM)', 50, 280);
      if (data.edm) {
        doc.fontSize(11).font('Helvetica');
        doc.text(`Campaigns Sent: ${data.edm.totalSent}`, 50, 310);
        doc.text(`Average Open Rate: ${(data.edm.avgOpenRate || 0).toFixed(2)}%`, 50, 330);
        doc.text(`Average Click Rate: ${(data.edm.avgClickRate || 0).toFixed(2)}%`, 50, 350);
      }

      // 社交媒体部分
      doc.fontSize(16).font('Helvetica-Bold').text('Social Media', 50, 400);
      if (data.social) {
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total Posts: ${(data.social.instagram?.length || 0) + (data.social.linkedin?.length || 0)}`, 50, 430);
        doc.text(`Total Engagement: ${data.social.totalEngagement || 0}`, 50, 450);
      }

      // UTM 追踪部分
      doc.fontSize(16).font('Helvetica-Bold').text('UTM Tracking', 50, 500);
      if (data.utm) {
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total Clicks: ${data.utm.totalClicks || 0}`, 50, 530);
        doc.text(`Total Campaigns: ${data.utm.campaigns?.length || 0}`, 50, 550);
      }

      // 页脚
      doc.fontSize(10).font('Helvetica').text(
        `Generated on ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')} | ACE Sign Analytics`,
        50,
        750,
        { align: 'center' }
      );

      doc.end();

      return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
          // 更新数据库中的文件路径
          await db('reports').where({ id: reportId }).update({
            file_path: filePath,
            file_size: fs.statSync(filePath).size
          });

          logger.info(`PDF report generated for report ${reportId}`, { filePath });
          resolve(filePath);
        });

        stream.on('error', (error) => {
          logger.error('Error writing PDF report', { error });
          reject(error);
        });
      });
    } catch (error) {
      logger.error(`Failed to generate PDF report for user ${userId}`, { error });
      throw error;
    }
  }

  /**
   * 获取 EDM 活动统计
   */
  private async getEDMCampaignStats(userId: number, startDate: Date, endDate: Date) {
    const db = getDatabase();
    return db('mailerlite_campaigns')
      .where({ user_id: userId })
      .whereBetween('sent_at', [startDate, endDate])
      .join('mailerlite_campaign_stats', 'mailerlite_campaigns.id', 'mailerlite_campaign_stats.campaign_id')
      .select('mailerlite_campaigns.*', 'mailerlite_campaign_stats.*');
  }

  /**
   * 获取 Meta 动态统计
   */
  private async getMetaPostStats(userId: number, startDate: Date, endDate: Date) {
    const db = getDatabase();
    return db('meta_posts')
      .where({ user_id: userId })
      .whereBetween('published_at', [startDate, endDate])
      .join('meta_post_stats', 'meta_posts.id', 'meta_post_stats.post_id')
      .select('meta_posts.*', 'meta_post_stats.*');
  }

  /**
   * 获取 LinkedIn 动态统计
   */
  private async getLinkedInPostStats(userId: number, startDate: Date, endDate: Date) {
    const db = getDatabase();
    return db('linkedin_posts')
      .where({ user_id: userId })
      .whereBetween('published_at', [startDate, endDate])
      .join('linkedin_post_stats', 'linkedin_posts.id', 'linkedin_post_stats.post_id')
      .select('linkedin_posts.*', 'linkedin_post_stats.*');
  }

  /**
   * 获取 UTM 统计
   */
  private async getUTMStats(userId: number, startDate: Date, endDate: Date) {
    const db = getDatabase();
    const links = await db('utm_links')
      .where({ user_id: userId })
      .whereBetween('created_at', [startDate, endDate]);

    const clicks = await db('utm_click_events')
      .whereIn('utm_link_id', links.map((l: any) => l.id))
      .count('* as count')
      .first();

    return {
      totalLinks: links.length,
      totalClicks: (clicks as any)?.count || 0,
      campaigns: links.map((l: any) => l.utm_campaign)
    };
  }

  /**
   * 获取 GA 指标
   */
  private async getGAMetrics(userId: number, startDate: Date, endDate: Date) {
    const db = getDatabase();
    const metrics = await db('ga4_daily_metrics')
      .whereIn('property_id',
        db('ga4_properties').where({ user_id: userId }).select('id')
      )
      .whereBetween('date', [startDate, endDate]);

    return {
      totalUsers: metrics.reduce((sum: number, m: any) => sum + (m.users || 0), 0),
      totalSessions: metrics.reduce((sum: number, m: any) => sum + (m.sessions || 0), 0),
      totalConversions: metrics.reduce((sum: number, m: any) => sum + (m.conversion_count || 0), 0),
      totalRevenue: metrics.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0)
    };
  }

  /**
   * 计算平均值
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
}

export default new ReportGenerator();
