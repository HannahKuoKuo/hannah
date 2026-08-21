import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { query } from '../database/connection'
import { logger } from '../utils/logger'

const router = Router()

router.get('/data', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { startDate, endDate, platforms } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates required' })
    }

    const platformList = (platforms as string)?.split(',') || ['meta', 'email', 'ga4']
    const data: any = {}

    // 查询 Meta 数据
    if (platformList.includes('meta')) {
      const metaData = await query(
        `SELECT
           DATE(created_at) as date,
           SUM(CAST(data->>'impressions' AS INTEGER)) as impressions,
           SUM(CAST(data->>'reach' AS INTEGER)) as reach,
           SUM(CAST(data->>'engagement' AS INTEGER)) as engagement
         FROM social_metrics
         WHERE user_id = $1 AND platform = 'meta'
         AND DATE(created_at) BETWEEN $2 AND $3
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`,
        [userId, startDate, endDate]
      )
      data.meta = metaData.rows
    }

    // 查询 Email 数据
    if (platformList.includes('email')) {
      const emailData = await query(
        `SELECT
           DATE(created_at) as date,
           SUM(opens) as opens,
           SUM(clicks) as clicks,
           SUM(unsubscribes) as unsubscribes
         FROM email_metrics
         WHERE user_id = $1
         AND DATE(created_at) BETWEEN $2 AND $3
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`,
        [userId, startDate, endDate]
      )
      data.email = emailData.rows
    }

    // 查询 GA4 数据
    if (platformList.includes('ga4')) {
      const ga4Data = await query(
        `SELECT
           DATE(created_at) as date,
           SUM(active_users) as active_users,
           SUM(sessions) as sessions,
           AVG(engagement_rate) as engagement_rate,
           AVG(bounce_rate) as bounce_rate
         FROM ga_metrics
         WHERE user_id = $1
         AND DATE(created_at) BETWEEN $2 AND $3
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`,
        [userId, startDate, endDate]
      )
      data.ga4 = ga4Data.rows
    }

    res.json({
      startDate,
      endDate,
      platforms: platformList,
      data,
    })
  } catch (error) {
    logger.error('Monitoring Data Error:', error)
    res.status(500).json({ error: 'Failed to fetch monitoring data' })
  }
})

// 获取汇总统计
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { startDate, endDate, platform } = req.query

    if (!startDate || !endDate || !platform) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    let summary: any = {}

    switch (platform) {
      case 'meta':
        const metaSummary = await query(
          `SELECT
             SUM(CAST(data->>'impressions' AS INTEGER)) as total_impressions,
             SUM(CAST(data->>'reach' AS INTEGER)) as total_reach,
             SUM(CAST(data->>'engagement' AS INTEGER)) as total_engagement,
             AVG(CAST(data->>'impressions' AS INTEGER)) as avg_impressions
           FROM social_metrics
           WHERE user_id = $1 AND platform = 'meta'
           AND DATE(created_at) BETWEEN $2 AND $3`,
          [userId, startDate, endDate]
        )
        summary = metaSummary.rows[0]
        break

      case 'email':
        const emailSummary = await query(
          `SELECT
             SUM(opens) as total_opens,
             SUM(clicks) as total_clicks,
             SUM(unsubscribes) as total_unsubscribes,
             ROUND(100.0 * SUM(clicks) / NULLIF(SUM(opens), 0), 2) as click_rate
           FROM email_metrics
           WHERE user_id = $1
           AND DATE(created_at) BETWEEN $2 AND $3`,
          [userId, startDate, endDate]
        )
        summary = emailSummary.rows[0]
        break

      case 'ga4':
        const ga4Summary = await query(
          `SELECT
             SUM(active_users) as total_users,
             SUM(sessions) as total_sessions,
             AVG(engagement_rate) as avg_engagement_rate,
             AVG(bounce_rate) as avg_bounce_rate,
             ROUND(1.0 * SUM(sessions) / NULLIF(SUM(active_users), 0), 2) as sessions_per_user
           FROM ga_metrics
           WHERE user_id = $1
           AND DATE(created_at) BETWEEN $2 AND $3`,
          [userId, startDate, endDate]
        )
        summary = ga4Summary.rows[0]
        break
    }

    res.json(summary)
  } catch (error) {
    logger.error('Summary Error:', error)
    res.status(500).json({ error: 'Failed to fetch summary data' })
  }
})

// 获取对比数据
router.get('/comparison', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { startDate1, endDate1, startDate2, endDate2, platform } = req.query

    if (!startDate1 || !endDate1 || !startDate2 || !endDate2) {
      return res.status(400).json({ error: 'Missing date parameters' })
    }

    const platforms = (platform as string)?.split(',') || ['meta', 'email', 'ga4']
    const comparison: any = {}

    for (const plat of platforms) {
      const period1Data = await query(
        `SELECT * FROM analytics_data
         WHERE user_id = $1 AND metric_type = $2
         AND DATE(created_at) BETWEEN $3 AND $4`,
        [userId, plat, startDate1, endDate1]
      )

      const period2Data = await query(
        `SELECT * FROM analytics_data
         WHERE user_id = $1 AND metric_type = $2
         AND DATE(created_at) BETWEEN $3 AND $4`,
        [userId, plat, startDate2, endDate2]
      )

      const p1Sum = period1Data.rows.reduce(
        (sum, row) => sum + parseFloat(row.metric_value),
        0
      )
      const p2Sum = period2Data.rows.reduce(
        (sum, row) => sum + parseFloat(row.metric_value),
        0
      )
      const changePercent = p1Sum === 0 ? 0 : ((p2Sum - p1Sum) / p1Sum) * 100

      comparison[plat] = {
        period1Total: p1Sum,
        period2Total: p2Sum,
        change: p2Sum - p1Sum,
        changePercent: changePercent.toFixed(2),
      }
    }

    res.json(comparison)
  } catch (error) {
    logger.error('Comparison Error:', error)
    res.status(500).json({ error: 'Failed to fetch comparison data' })
  }
})

export default router
