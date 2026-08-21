import axios from 'axios';
import { logger } from '../../utils/logger';

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta';

export class GA4Service {
  private propertyId: string;
  private apiKey: string;

  constructor(propertyId: string, apiKey: string) {
    this.propertyId = propertyId;
    this.apiKey = apiKey;
  }

  async getMetrics(startDate: string, endDate: string) {
    try {
      const response = await axios.post(
        `${GA4_API}/properties/${this.propertyId}:runReport?key=${this.apiKey}`,
        {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'engagementRate' },
            { name: 'bounceRate' },
          ],
        }
      );
      return response.data;
    } catch (error) {
      logger.error('GA4 Metrics Error:', error);
      throw error;
    }
  }

  async getPageMetrics(startDate: string, endDate: string) {
    try {
      const response = await axios.post(
        `${GA4_API}/properties/${this.propertyId}:runReport?key=${this.apiKey}`,
        {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'sessionDuration' },
          ],
          dimensions: [{ name: 'pagePath' }],
        }
      );
      return response.data;
    } catch (error) {
      logger.error('GA4 Page Metrics Error:', error);
      throw error;
    }
  }

  async getConversions(startDate: string, endDate: string) {
    try {
      const response = await axios.post(
        `${GA4_API}/properties/${this.propertyId}:runReport?key=${this.apiKey}`,
        {
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: 'conversions' }],
          dimensions: [{ name: 'eventName' }],
        }
      );
      return response.data;
    } catch (error) {
      logger.error('GA4 Conversions Error:', error);
      throw error;
    }
  }
}
