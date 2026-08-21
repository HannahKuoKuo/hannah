import axios, { AxiosInstance } from 'axios';
import { logger } from '../backend/src/utils/logger';

export class GA4API {
  private client: AxiosInstance;
  private propertyId: string;
  private accessToken: string;

  constructor(propertyId: string, accessToken: string) {
    this.propertyId = propertyId;
    this.accessToken = accessToken;

    this.client = axios.create({
      baseURL: 'https://analyticsreporting.googleapis.com/v4',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      timeout: 30000
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('GA4 API Error', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message
        });
        throw error;
      }
    );
  }

  /**
   * 获取日期范围的用户数据
   */
  async getUserMetrics(startDate: string, endDate: string) {
    try {
      const response = await this.client.post('/reports:batchGet', {
        reportRequests: [
          {
            viewId: this.propertyId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            metrics: [
              { expression: 'ga:users' },
              { expression: 'ga:newUsers' },
              { expression: 'ga:sessions' },
              { expression: 'ga:bounceRate' },
              { expression: 'ga:pageviewsPerSession' },
              { expression: 'ga:avgSessionDuration' },
              { expression: 'ga:goalConversionRateAll' },
              { expression: 'ga:goalCompletionsAll' },
              { expression: 'ga:goalValueAll' }
            ],
            dimensions: [
              { name: 'ga:date' }
            ]
          }
        ]
      });

      logger.info(`Retrieved GA4 user metrics for ${startDate} to ${endDate}`);
      return this.parseReport(response.data);
    } catch (error) {
      logger.error('Failed to get GA4 user metrics', { error });
      throw error;
    }
  }

  /**
   * 获取流量来源数据
   */
  async getTrafficSources(startDate: string, endDate: string) {
    try {
      const response = await this.client.post('/reports:batchGet', {
        reportRequests: [
          {
            viewId: this.propertyId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            metrics: [
              { expression: 'ga:sessions' },
              { expression: 'ga:users' },
              { expression: 'ga:goalCompletionsAll' },
              { expression: 'ga:goalValueAll' }
            ],
            dimensions: [
              { name: 'ga:source' },
              { name: 'ga:medium' },
              { name: 'ga:campaign' }
            ]
          }
        ]
      });

      logger.info(`Retrieved GA4 traffic sources for ${startDate} to ${endDate}`);
      return this.parseReport(response.data);
    } catch (error) {
      logger.error('Failed to get GA4 traffic sources', { error });
      throw error;
    }
  }

  /**
   * 获取页面性能数据
   */
  async getPagePerformance(startDate: string, endDate: string) {
    try {
      const response = await this.client.post('/reports:batchGet', {
        reportRequests: [
          {
            viewId: this.propertyId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            metrics: [
              { expression: 'ga:pageviews' },
              { expression: 'ga:uniquePageviews' },
              { expression: 'ga:avgTimeOnPage' },
              { expression: 'ga:bounceRate' },
              { expression: 'ga:goalConversionRateAll' }
            ],
            dimensions: [
              { name: 'ga:pagePath' }
            ],
            orderBys: [
              {
                fieldName: 'ga:pageviews',
                sortOrder: 'DESCENDING'
              }
            ],
            pageSize: 50
          }
        ]
      });

      logger.info(`Retrieved GA4 page performance for ${startDate} to ${endDate}`);
      return this.parseReport(response.data);
    } catch (error) {
      logger.error('Failed to get GA4 page performance', { error });
      throw error;
    }
  }

  /**
   * 获取用户特征数据
   */
  async getUserDemographics(startDate: string, endDate: string) {
    try {
      const response = await this.client.post('/reports:batchGet', {
        reportRequests: [
          {
            viewId: this.propertyId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            metrics: [
              { expression: 'ga:users' },
              { expression: 'ga:sessions' }
            ],
            dimensions: [
              { name: 'ga:country' },
              { name: 'ga:deviceCategory' }
            ]
          }
        ]
      });

      logger.info(`Retrieved GA4 user demographics for ${startDate} to ${endDate}`);
      return this.parseReport(response.data);
    } catch (error) {
      logger.error('Failed to get GA4 user demographics', { error });
      throw error;
    }
  }

  /**
   * 获取转换数据
   */
  async getConversions(startDate: string, endDate: string) {
    try {
      const response = await this.client.post('/reports:batchGet', {
        reportRequests: [
          {
            viewId: this.propertyId,
            dateRanges: [
              {
                startDate,
                endDate
              }
            ],
            metrics: [
              { expression: 'ga:goalCompletionsAll' },
              { expression: 'ga:goalConversionRateAll' },
              { expression: 'ga:goalValueAll' }
            ],
            dimensions: [
              { name: 'ga:goalName' },
              { name: 'ga:date' }
            ]
          }
        ]
      });

      logger.info(`Retrieved GA4 conversion data for ${startDate} to ${endDate}`);
      return this.parseReport(response.data);
    } catch (error) {
      logger.error('Failed to get GA4 conversions', { error });
      throw error;
    }
  }

  /**
   * 解析 GA4 报告数据
   */
  private parseReport(data: any) {
    if (!data.reports || data.reports.length === 0) {
      return { rows: [], totals: {} };
    }

    const report = data.reports[0];
    const rows: any[] = [];

    if (report.data && report.data.rows) {
      for (const row of report.data.rows) {
        const rowData: any = {};

        // 添加维度
        if (row.dimensions) {
          report.columnHeader.dimensions.forEach((dimension: string, index: number) => {
            rowData[dimension] = row.dimensions[index];
          });
        }

        // 添加指标
        if (row.metrics) {
          row.metrics[0].values.forEach((value: string, index: number) => {
            const metricName = report.columnHeader.metricHeader.metricHeaderEntries[index].name;
            rowData[metricName] = isNaN(Number(value)) ? value : Number(value);
          });
        }

        rows.push(rowData);
      }
    }

    // 获取总计
    const totals: any = {};
    if (report.data && report.data.totals) {
      report.columnHeader.metricHeader.metricHeaderEntries.forEach((entry: any, index: number) => {
        totals[entry.name] = Number(report.data.totals[0].values[index]);
      });
    }

    return { rows, totals };
  }
}

export default GA4API;
