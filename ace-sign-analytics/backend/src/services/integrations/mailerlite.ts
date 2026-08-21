import axios from 'axios';
import { logger } from '../../utils/logger';

const MAILERLITE_API = 'https://connect.mailerlite.com/api';

export class MailerLiteService {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getCampaigns() {
    try {
      const response = await axios.get(`${MAILERLITE_API}/campaigns`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      logger.error('MailerLite Campaigns Error:', error);
      throw error;
    }
  }

  async getCampaignStats(campaignId: string) {
    try {
      const response = await axios.get(
        `${MAILERLITE_API}/campaigns/${campaignId}/stats`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('MailerLite Stats Error:', error);
      throw error;
    }
  }

  async getSubscribers() {
    try {
      const response = await axios.get(`${MAILERLITE_API}/subscribers`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      logger.error('MailerLite Subscribers Error:', error);
      throw error;
    }
  }

  async createCampaign(title: string, content: string) {
    try {
      const response = await axios.post(
        `${MAILERLITE_API}/campaigns`,
        { title, content },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      logger.error('MailerLite Create Campaign Error:', error);
      throw error;
    }
  }
}
