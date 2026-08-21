import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { query } from '../database/connection'
import { logger } from '../utils/logger'

const router = Router()

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id

    const result = await query(
      'SELECT * FROM utm_links WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    res.json(result.rows)
  } catch (error) {
    logger.error('UTM Links Fetch Error:', error)
    res.status(500).json({ error: 'Failed to fetch UTM links' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { baseUrl, source, medium, campaign, content } = req.body

    const utmUrl = new URL(baseUrl)
    utmUrl.searchParams.append('utm_source', source)
    utmUrl.searchParams.append('utm_medium', medium)
    utmUrl.searchParams.append('utm_campaign', campaign)
    if (content) utmUrl.searchParams.append('utm_content', content)

    const result = await query(
      `INSERT INTO utm_links (user_id, base_url, source, medium, campaign, content, utm_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, baseUrl, source, medium, campaign, content, utmUrl.toString()]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    logger.error('Create UTM Link Error:', error)
    res.status(500).json({ error: 'Failed to create UTM link' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const result = await query(
      'SELECT * FROM utm_links WHERE id = $1 AND user_id = $2',
      [id, req.user?.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'UTM link not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    logger.error('UTM Link Fetch Error:', error)
    res.status(500).json({ error: 'Failed to fetch UTM link' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    await query('DELETE FROM utm_links WHERE id = $1 AND user_id = $2', [
      id,
      req.user?.id,
    ])

    res.json({ success: true })
  } catch (error) {
    logger.error('Delete UTM Link Error:', error)
    res.status(500).json({ error: 'Failed to delete UTM link' })
  }
})

export default router
