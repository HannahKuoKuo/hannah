import { getDatabase } from '../utils/database';
import { logger } from '../utils/logger';
import axios from 'axios';

export class UTMService {
  /**
   * 生成 UTM 参数字符串
   */
  static generateUTMParams(params: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
  }): string {
    const parts = [
      `utm_source=${encodeURIComponent(params.utm_source)}`,
      `utm_medium=${encodeURIComponent(params.utm_medium)}`,
      `utm_campaign=${encodeURIComponent(params.utm_campaign)}`
    ];

    if (params.utm_content) {
      parts.push(`utm_content=${encodeURIComponent(params.utm_content)}`);
    }

    if (params.utm_term) {
      parts.push(`utm_term=${encodeURIComponent(params.utm_term)}`);
    }

    return parts.join('&');
  }

  /**
   * 生成完整的 UTM 链接
   */
  static generateFullURL(baseUrl: string, utmParams: string): string {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${utmParams}`;
  }

  /**
   * 创建 UTM 链接
   */
  async createUTMLink(
    userId: number,
    data: {
      original_url: string;
      utm_source: string;
      utm_medium: string;
      utm_campaign: string;
      utm_content?: string;
      utm_term?: string;
      short_url?: string;
      campaign_id?: number;
      post_id?: number;
    }
  ) {
    try {
      const db = getDatabase();
      const utmParams = UTMService.generateUTMParams({
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        utm_content: data.utm_content,
        utm_term: data.utm_term
      });

      const fullURL = UTMService.generateFullURL(data.original_url, utmParams);

      // 尝试生成短链接
      let shortUrl = data.short_url;
      if (!shortUrl) {
        try {
          shortUrl = await this.generateShortURL(fullURL);
        } catch (error) {
          logger.warn('Failed to generate short URL, using full URL', { error });
          shortUrl = fullURL;
        }
      }

      // 保存到数据库
      const result = await db('utm_links').insert({
        user_id: userId,
        original_url: data.original_url,
        short_url: shortUrl,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        utm_content: data.utm_content,
        utm_term: data.utm_term,
        created_by_campaign_id: data.campaign_id,
        created_by_post_id: data.post_id,
        created_at: new Date()
      }).returning('*');

      logger.info(`Created UTM link for user ${userId}`, {
        source: data.utm_source,
        medium: data.utm_medium,
        campaign: data.utm_campaign
      });

      return result[0];
    } catch (error) {
      logger.error('Failed to create UTM link', { error });
      throw error;
    }
  }

  /**
   * 获取用户的 UTM 链接
   */
  async getUserUTMLinks(userId: number, limit: number = 100, offset: number = 0) {
    try {
      const db = getDatabase();
      const links = await db('utm_links')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db('utm_links')
        .where({ user_id: userId })
        .count('* as count')
        .first();

      return {
        data: links,
        total: (total as any)?.count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error('Failed to get UTM links', { error });
      throw error;
    }
  }

  /**
   * 获取 UTM 链接的点击统计
   */
  async getUTMLinkStats(linkId: number) {
    try {
      const db = getDatabase();

      const link = await db('utm_links').where({ id: linkId }).first();
      if (!link) {
        throw new Error('UTM link not found');
      }

      const clicks = await db('utm_click_events')
        .where({ utm_link_id: linkId })
        .select('*')
        .orderBy('clicked_at', 'desc');

      const stats = {
        total_clicks: clicks.length,
        by_country: this.groupBy(clicks, 'country'),
        by_device: this.groupBy(clicks, 'device_type'),
        by_browser: this.groupBy(clicks, 'browser'),
        by_os: this.groupBy(clicks, 'operating_system'),
        recent_clicks: clicks.slice(0, 10)
      };

      return {
        link,
        stats,
        clicks
      };
    } catch (error) {
      logger.error(`Failed to get stats for UTM link ${linkId}`, { error });
      throw error;
    }
  }

  /**
   * 记录 UTM 点击事件
   */
  async recordUTMClick(
    linkId: number,
    data: {
      referrer?: string;
      user_agent?: string;
      ip_address?: string;
      country?: string;
      device_type?: string;
      browser?: string;
      operating_system?: string;
    }
  ) {
    try {
      const db = getDatabase();

      // 记录点击事件
      await db('utm_click_events').insert({
        utm_link_id: linkId,
        referrer: data.referrer,
        user_agent: data.user_agent,
        ip_address: data.ip_address,
        country: data.country,
        device_type: data.device_type,
        browser: data.browser,
        operating_system: data.operating_system,
        clicked_at: new Date()
      });

      // 更新链接的点击计数
      await db('utm_links')
        .where({ id: linkId })
        .increment('click_count', 1)
        .update({ updated_at: new Date() });

      logger.debug(`Recorded click for UTM link ${linkId}`);
    } catch (error) {
      logger.error(`Failed to record click for UTM link ${linkId}`, { error });
    }
  }

  /**
   * 删除 UTM 链接
   */
  async deleteUTMLink(userId: number, linkId: number) {
    try {
      const db = getDatabase();

      // 验证链接所有权
      const link = await db('utm_links')
        .where({ id: linkId, user_id: userId })
        .first();

      if (!link) {
        throw new Error('UTM link not found or you do not have permission to delete it');
      }

      // 删除相关的点击事件
      await db('utm_click_events').where({ utm_link_id: linkId }).del();

      // 删除链接
      await db('utm_links').where({ id: linkId }).del();

      logger.info(`Deleted UTM link ${linkId}`);
    } catch (error) {
      logger.error(`Failed to delete UTM link ${linkId}`, { error });
      throw error;
    }
  }

  /**
   * 生成短链接（使用 TinyURL）
   */
  private async generateShortURL(longUrl: string): Promise<string> {
    try {
      const response = await axios.get('https://tinyurl.com/api/create.php', {
        params: { url: longUrl },
        timeout: 5000
      });

      if (response.status === 200 && response.data) {
        return response.data;
      }

      throw new Error('Invalid response from shortener service');
    } catch (error) {
      logger.warn('Failed to generate short URL', { error });
      throw error;
    }
  }

  /**
   * 按字段分组
   */
  private groupBy(items: any[], field: string): Record<string, number> {
    return items.reduce((result, item) => {
      const key = item[field] || 'Unknown';
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {} as Record<string, number>);
  }

  /**
   * 获取 UTM 活动概览
   */
  async getUTMCampaignSummary(userId: number) {
    try {
      const db = getDatabase();

      const summary = await db('utm_links')
        .where({ user_id: userId })
        .select('utm_campaign', 'utm_medium', 'utm_source')
        .count('* as link_count')
        .sum('click_count as total_clicks')
        .groupBy('utm_campaign', 'utm_medium', 'utm_source')
        .orderBy('total_clicks', 'desc');

      return summary;
    } catch (error) {
      logger.error('Failed to get UTM campaign summary', { error });
      throw error;
    }
  }
}

export default new UTMService();
