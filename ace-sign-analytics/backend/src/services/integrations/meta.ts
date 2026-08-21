import axios from 'axios';
import { logger } from '../../utils/logger';

const META_API_VERSION = 'v18.0';
const META_GRAPH_API = 'https://graph.instagram.com';

export class MetaService {
  private accessToken: string;
  private pageId: string;

  constructor(accessToken: string, pageId: string) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  async getPageInsights() {
    try {
      const response = await axios.get(
        `${META_GRAPH_API}/${META_API_VERSION}/${this.pageId}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views,follower_count',
            access_token: this.accessToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Meta API Error:', error);
      throw error;
    }
  }

  async getPostMetrics(postId: string) {
    try {
      const response = await axios.get(
        `${META_GRAPH_API}/${META_API_VERSION}/${postId}/insights`,
        {
          params: {
            metric: 'engagement,impressions,reach,saved',
            access_token: this.accessToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Meta Post Metrics Error:', error);
      throw error;
    }
  }

  async createPost(caption: string, mediaUrl?: string) {
    try {
      const data: any = {
        caption,
        access_token: this.accessToken,
      };

      if (mediaUrl) {
        data.image_url = mediaUrl;
      }

      const response = await axios.post(
        `${META_GRAPH_API}/${META_API_VERSION}/${this.pageId}/feed`,
        data
      );
      return response.data;
    } catch (error) {
      logger.error('Meta Create Post Error:', error);
      throw error;
    }
  }
}
