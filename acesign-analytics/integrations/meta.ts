import axios, { AxiosInstance } from 'axios';
import { logger } from '../backend/src/utils/logger';

export class MetaAPI {
  private client: AxiosInstance;
  private appId: string;
  private appSecret: string;
  private pageAccessToken: string;

  constructor(
    appId: string,
    appSecret: string,
    pageAccessToken: string
  ) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.pageAccessToken = pageAccessToken;

    this.client = axios.create({
      baseURL: 'https://graph.instagram.com',
      params: {
        access_token: pageAccessToken
      },
      timeout: 30000
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Meta API Error', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
          url: error.config?.url
        });
        throw error;
      }
    );
  }

  /**
   * 获取 Instagram 账户信息
   */
  async getInstagramAccount(pageId: string) {
    try {
      const response = await this.client.get(`/${pageId}`, {
        params: {
          fields: 'instagram_business_account,followers_count,name,biography,profile_picture_url'
        }
      });
      logger.info(`Retrieved Instagram account info for page ${pageId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get Instagram account for page ${pageId}`, { error });
      throw error;
    }
  }

  /**
   * 获取 Instagram 动态
   */
  async getInstagramPosts(instagramAccountId: string, limit: number = 25) {
    try {
      const response = await this.client.get(
        `/${instagramAccountId}/media`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,timestamp,like_count,comments_count',
            limit,
            order: 'reverse_chronological'
          }
        }
      );
      logger.info(`Retrieved ${response.data.data.length} posts from Instagram account`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get Instagram posts for account ${instagramAccountId}`, { error });
      throw error;
    }
  }

  /**
   * 获取单个动态的详情
   */
  async getPostInsights(postId: string) {
    try {
      const response = await this.client.get(`/${postId}/insights`, {
        params: {
          metric: 'engagement,impressions,reach,saved,video_views',
          access_token: this.pageAccessToken
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get insights for post ${postId}`, { error });
      return { data: [] };
    }
  }

  /**
   * 获取粉丝统计
   */
  async getFollowerStats(instagramAccountId: string) {
    try {
      const response = await this.client.get(
        `/${instagramAccountId}/insights`,
        {
          params: {
            metric: 'follower_count,profile_views',
            period: 'day'
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get follower stats for account ${instagramAccountId}`, { error });
      return { data: [] };
    }
  }

  /**
   * 创建动态
   */
  async createPost(
    instagramAccountId: string,
    data: {
      image_url: string;
      caption: string;
      user_tags?: Array<{ x: number; y: number; username: string }>;
      location_id?: string;
    }
  ) {
    try {
      const response = await this.client.post(
        `/${instagramAccountId}/media`,
        {
          image_url: data.image_url,
          caption: data.caption,
          user_tags: data.user_tags,
          location_id: data.location_id,
          access_token: this.pageAccessToken
        }
      );
      logger.info(`Created Instagram post for account ${instagramAccountId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to create Instagram post`, { error });
      throw error;
    }
  }

  /**
   * 发布动态
   */
  async publishPost(mediaId: string) {
    try {
      const response = await this.client.post(
        `/${mediaId}/publish`,
        {},
        {
          params: {
            access_token: this.pageAccessToken
          }
        }
      );
      logger.info(`Published Instagram post ${mediaId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to publish post ${mediaId}`, { error });
      throw error;
    }
  }

  /**
   * 获取 Facebook 页面信息
   */
  async getFacebookPageInfo(pageId: string) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pageId}`,
        {
          params: {
            fields: 'id,name,followers_count,picture,about',
            access_token: this.pageAccessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get Facebook page info for ${pageId}`, { error });
      throw error;
    }
  }

  /**
   * 获取 Facebook 页面的动态
   */
  async getFacebookPosts(pageId: string, limit: number = 25) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          params: {
            fields: 'id,message,created_time,type,story,picture,link,likes.limit(0).summary(true),comments.limit(0).summary(true),shares',
            limit,
            access_token: this.pageAccessToken
          }
        }
      );
      logger.info(`Retrieved ${response.data.data.length} posts from Facebook page`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get Facebook posts for page ${pageId}`, { error });
      throw error;
    }
  }

  /**
   * 同步所有数据
   */
  async syncAllData(pageId: string, instagramAccountId: string) {
    try {
      const [pageInfo, fbPosts, igAccount, igPosts, followerStats] = await Promise.all([
        this.getFacebookPageInfo(pageId),
        this.getFacebookPosts(pageId),
        this.getInstagramAccount(instagramAccountId),
        this.getInstagramPosts(instagramAccountId),
        this.getFollowerStats(instagramAccountId)
      ]);

      logger.info('Successfully synced all Meta data');
      return {
        facebook: {
          pageInfo,
          posts: fbPosts
        },
        instagram: {
          account: igAccount,
          posts: igPosts,
          followerStats
        },
        syncedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to sync all Meta data', { error });
      throw error;
    }
  }
}

export default MetaAPI;
