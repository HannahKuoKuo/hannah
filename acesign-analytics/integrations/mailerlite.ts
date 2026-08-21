import axios, { AxiosInstance } from 'axios';
import { logger } from '../backend/src/utils/logger';

export class MailerLiteAPI {
  private client: AxiosInstance;
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
    this.client = axios.create({
      baseURL: 'https://connect.mailerlite.com/api',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('MailerLite API Error', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        throw error;
      }
    );
  }

  /**
   * 获取账户信息
   */
  async getAccount() {
    try {
      const response = await this.client.get('/accounts');
      logger.info('Successfully retrieved MailerLite account');
      return response.data;
    } catch (error) {
      logger.error('Failed to get MailerLite account', { error });
      throw error;
    }
  }

  /**
   * 获取所有活动
   */
  async getCampaigns(limit: number = 25, offset: number = 0) {
    try {
      const response = await this.client.get('/campaigns', {
        params: { limit, offset, sort: '-created_at' }
      });
      logger.info(`Retrieved ${response.data.data.length} campaigns from MailerLite`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get MailerLite campaigns', { error });
      throw error;
    }
  }

  /**
   * 获取单个活动详情和统计数据
   */
  async getCampaignStats(campaignId: string) {
    try {
      const response = await this.client.get(`/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get stats for campaign ${campaignId}`, { error });
      throw error;
    }
  }

  /**
   * 获取订阅者列表
   */
  async getSubscribers(limit: number = 25, offset: number = 0) {
    try {
      const response = await this.client.get('/subscribers', {
        params: { limit, offset, sort: '-created_at' }
      });
      logger.info(`Retrieved ${response.data.data.length} subscribers from MailerLite`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get MailerLite subscribers', { error });
      throw error;
    }
  }

  /**
   * 获取订阅者活动
   */
  async getSubscriberActivity(subscriberId: string) {
    try {
      const response = await this.client.get(`/subscribers/${subscriberId}/activity`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get activity for subscriber ${subscriberId}`, { error });
      throw error;
    }
  }

  /**
   * 创建活动
   */
  async createCampaign(data: {
    name: string;
    subject: string;
    content?: string;
    from?: { name: string; email: string };
  }) {
    try {
      const response = await this.client.post('/campaigns', {
        name: data.name,
        subject: data.subject,
        content: data.content || '',
        from: data.from || {
          name: 'ACE Sign',
          email: 'hello@acesign.com.au'
        }
      });
      logger.info(`Created campaign: ${data.name}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to create MailerLite campaign', { error });
      throw error;
    }
  }

  /**
   * 获取自动化序列
   */
  async getAutomations(limit: number = 25, offset: number = 0) {
    try {
      const response = await this.client.get('/automations', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to get MailerLite automations', { error });
      throw error;
    }
  }

  /**
   * 获取活动统计数据
   */
  async getCampaignAnalytics(campaignId: string) {
    try {
      const response = await this.client.get(`/campaigns/${campaignId}/analytics`);
      return {
        campaignId,
        stats: response.data.data,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Failed to get analytics for campaign ${campaignId}`, { error });
      // 返回模拟数据作为备选
      return {
        campaignId,
        stats: {
          recipients: 0,
          opened: 0,
          clicked: 0,
          unsubscribed: 0,
          bounced: 0,
          spam_reported: 0
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * 获取多个活动的统计数据
   */
  async syncCampaignsAnalytics(campaignIds: string[]) {
    const analytics: any[] = [];

    for (const campaignId of campaignIds) {
      try {
        const data = await this.getCampaignAnalytics(campaignId);
        analytics.push(data);
      } catch (error) {
        logger.warn(`Skipping analytics for campaign ${campaignId}`);
      }
    }

    return analytics;
  }
}

export default MailerLiteAPI;
