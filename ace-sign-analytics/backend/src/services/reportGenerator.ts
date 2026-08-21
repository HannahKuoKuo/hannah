import { query } from '../database/connection';
import { logger } from '../utils/logger';

export async function generateReport(
  userId: string,
  startDate: string,
  endDate: string,
  metrics: string[]
) {
  try {
    const reportData: any = {
      userId,
      startDate,
      endDate,
      generatedAt: new Date(),
    };

    for (const metric of metrics) {
      switch (metric) {
        case 'email':
          const emailData = await query(
            `SELECT * FROM email_metrics
             WHERE user_id = $1
             AND DATE(created_at) >= $2
             AND DATE(created_at) <= $3`,
            [userId, startDate, endDate]
          );
          reportData.emailMetrics = emailData.rows;
          break;

        case 'social':
          const socialData = await query(
            `SELECT * FROM social_metrics
             WHERE user_id = $1
             AND DATE(created_at) >= $2
             AND DATE(created_at) <= $3`,
            [userId, startDate, endDate]
          );
          reportData.socialMetrics = socialData.rows;
          break;

        case 'ga':
          const gaData = await query(
            `SELECT * FROM ga_metrics
             WHERE user_id = $1
             AND DATE(created_at) >= $2
             AND DATE(created_at) <= $3`,
            [userId, startDate, endDate]
          );
          reportData.gaMetrics = gaData.rows;
          break;
      }
    }

    return reportData;
  } catch (error) {
    logger.error('Report Generation Error:', error);
    throw error;
  }
}
