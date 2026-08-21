import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import db from '../utils/db';

const router = Router();

interface TouchPoint {
  source: string;
  timestamp: string;
  value?: number;
}

interface ConversionPath {
  userId: string;
  touchpoints: TouchPoint[];
  conversionValue: number;
  conversionDate: string;
}

// Attribution model types
type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';

// Calculate attribution based on model
const calculateAttribution = (touchpoints: TouchPoint[], model: AttributionModel): Record<string, number> => {
  const attribution: Record<string, number> = {};

  if (touchpoints.length === 0) return attribution;

  const value = 1; // Normalized value per conversion

  switch (model) {
    case 'first_touch':
      if (touchpoints.length > 0) {
        attribution[touchpoints[0].source] = value;
      }
      break;

    case 'last_touch':
      if (touchpoints.length > 0) {
        attribution[touchpoints[touchpoints.length - 1].source] = value;
      }
      break;

    case 'linear':
      const linearShare = value / touchpoints.length;
      touchpoints.forEach(tp => {
        attribution[tp.source] = (attribution[tp.source] || 0) + linearShare;
      });
      break;

    case 'time_decay':
      // More recent touchpoints get more credit (exponential decay)
      const decayFactor = 0.5;
      let totalWeight = 0;
      const weights: number[] = [];

      for (let i = 0; i < touchpoints.length; i++) {
        const weight = Math.pow(decayFactor, touchpoints.length - 1 - i);
        weights.push(weight);
        totalWeight += weight;
      }

      touchpoints.forEach((tp, i) => {
        attribution[tp.source] = (attribution[tp.source] || 0) + (weights[i] / totalWeight) * value;
      });
      break;

    case 'position_based':
      // First and last get 40% each, middle gets 20%
      if (touchpoints.length === 1) {
        attribution[touchpoints[0].source] = value;
      } else if (touchpoints.length === 2) {
        attribution[touchpoints[0].source] = value * 0.5;
        attribution[touchpoints[1].source] = value * 0.5;
      } else {
        attribution[touchpoints[0].source] = value * 0.4;
        attribution[touchpoints[touchpoints.length - 1].source] = value * 0.4;

        const middleShare = (value * 0.2) / (touchpoints.length - 2);
        for (let i = 1; i < touchpoints.length - 1; i++) {
          attribution[touchpoints[i].source] = (attribution[touchpoints[i].source] || 0) + middleShare;
        }
      }
      break;
  }

  return attribution;
};

// Get multi-channel attribution analysis
router.get('/analysis', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { model = 'last_touch', dateRange = 30 } = req.query;

    logger.info(`Calculating ${model} attribution for user ${userId}`);

    // Mock data - in production, this would query actual conversion paths
    const mockConversionPaths: ConversionPath[] = [
      {
        userId,
        touchpoints: [
          { source: 'facebook', timestamp: '2024-08-01', value: 0 },
          { source: 'google_ads', timestamp: '2024-08-05', value: 0 },
          { source: 'email', timestamp: '2024-08-10', value: 0 }
        ],
        conversionValue: 100,
        conversionDate: '2024-08-10'
      },
      {
        userId,
        touchpoints: [
          { source: 'instagram', timestamp: '2024-08-02', value: 0 },
          { source: 'utm', timestamp: '2024-08-08', value: 0 }
        ],
        conversionValue: 150,
        conversionDate: '2024-08-08'
      },
      {
        userId,
        touchpoints: [
          { source: 'linkedin', timestamp: '2024-08-03', value: 0 },
          { source: 'email', timestamp: '2024-08-07', value: 0 }
        ],
        conversionValue: 200,
        conversionDate: '2024-08-07'
      }
    ];

    // Calculate attribution for each conversion path
    const channelAttribution: Record<string, number> = {};
    const conversionCount: Record<string, number> = {};

    mockConversionPaths.forEach(path => {
      const attribution = calculateAttribution(path.touchpoints, model as AttributionModel);
      Object.entries(attribution).forEach(([channel, credit]) => {
        channelAttribution[channel] = (channelAttribution[channel] || 0) + credit * path.conversionValue;
        conversionCount[channel] = (conversionCount[channel] || 0) + credit;
      });
    });

    // Get channel costs (mock data)
    const channelCosts: Record<string, number> = {
      facebook: 500,
      google_ads: 1200,
      email: 50,
      instagram: 400,
      utm: 100,
      linkedin: 800
    };

    // Calculate ROI
    const channelROI: Record<string, any> = {};
    Object.entries(channelAttribution).forEach(([channel, revenue]) => {
      const cost = channelCosts[channel] || 0;
      const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
      const roas = cost > 0 ? revenue / cost : 0;

      channelROI[channel] = {
        revenue,
        cost,
        roi,
        roas,
        conversions: conversionCount[channel] || 0
      };
    });

    res.json({
      attributionModel: model,
      data: channelROI,
      summary: {
        totalRevenue: Object.values(channelAttribution).reduce((a, b) => a + b, 0),
        totalCost: Object.values(channelCosts).reduce((a, b) => a + b, 0),
        averageROI: Object.values(channelROI).reduce((sum, ch) => sum + ch.roi, 0) / Object.keys(channelROI).length
      }
    });
  } catch (error) {
    logger.error('Failed to calculate attribution', { error });
    next(error);
  }
});

// Get channel contribution over time
router.get('/timeline', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { model = 'last_touch' } = req.query;

    const timelineData = [
      { date: '2024-08-01', facebook: 450, google_ads: 800, email: 150, instagram: 300, utm: 80, linkedin: 400 },
      { date: '2024-08-02', facebook: 520, google_ads: 950, email: 180, instagram: 350, utm: 120, linkedin: 480 },
      { date: '2024-08-03', facebook: 480, google_ads: 890, email: 200, instagram: 380, utm: 100, linkedin: 520 },
      { date: '2024-08-04', facebook: 550, google_ads: 1100, email: 220, instagram: 420, utm: 140, linkedin: 600 },
      { date: '2024-08-05', facebook: 610, google_ads: 1250, email: 250, instagram: 450, utm: 160, linkedin: 650 },
      { date: '2024-08-06', facebook: 580, google_ads: 1180, email: 280, instagram: 480, utm: 180, linkedin: 620 },
      { date: '2024-08-07', facebook: 620, google_ads: 1300, email: 300, instagram: 510, utm: 200, linkedin: 680 },
      { date: '2024-08-08', facebook: 650, google_ads: 1400, email: 320, instagram: 540, utm: 220, linkedin: 720 },
      { date: '2024-08-09', facebook: 680, google_ads: 1500, email: 350, instagram: 570, utm: 240, linkedin: 760 },
      { date: '2024-08-10', facebook: 700, google_ads: 1600, email: 380, instagram: 600, utm: 260, linkedin: 800 }
    ];

    res.json({
      attributionModel: model,
      data: timelineData
    });
  } catch (error) {
    logger.error('Failed to fetch attribution timeline', { error });
    next(error);
  }
});

// Compare attribution models
router.get('/compare-models', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const models: AttributionModel[] = ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'];

    // Mock conversion paths
    const mockConversionPaths: ConversionPath[] = [
      {
        userId,
        touchpoints: [
          { source: 'facebook', timestamp: '2024-08-01', value: 0 },
          { source: 'google_ads', timestamp: '2024-08-05', value: 0 },
          { source: 'email', timestamp: '2024-08-10', value: 0 }
        ],
        conversionValue: 500,
        conversionDate: '2024-08-10'
      },
      {
        userId,
        touchpoints: [
          { source: 'instagram', timestamp: '2024-08-02', value: 0 },
          { source: 'utm', timestamp: '2024-08-08', value: 0 }
        ],
        conversionValue: 300,
        conversionDate: '2024-08-08'
      }
    ];

    const comparison: Record<string, Record<string, number>> = {};

    models.forEach(model => {
      const channelAttribution: Record<string, number> = {};

      mockConversionPaths.forEach(path => {
        const attribution = calculateAttribution(path.touchpoints, model);
        Object.entries(attribution).forEach(([channel, credit]) => {
          channelAttribution[channel] = (channelAttribution[channel] || 0) + credit * path.conversionValue;
        });
      });

      comparison[model] = channelAttribution;
    });

    res.json({
      data: comparison,
      description: 'Comparison of different attribution models for the same conversion data'
    });
  } catch (error) {
    logger.error('Failed to compare models', { error });
    next(error);
  }
});

// Get ROI matrix (channels vs metrics)
router.get('/roi-matrix', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { model = 'last_touch' } = req.query;

    const roiMatrix = [
      { channel: 'Facebook', cpc: 1.2, ctr: 2.8, conversions: 45, revenue: 4500, roi: 350 },
      { channel: 'Google Ads', cpc: 2.5, ctr: 3.2, conversions: 78, revenue: 9600, roi: 400 },
      { channel: 'Email', cpc: 0.1, ctr: 5.2, conversions: 120, revenue: 3600, roi: 7100 },
      { channel: 'Instagram', cpc: 0.8, ctr: 2.1, conversions: 32, revenue: 2400, roi: 500 },
      { channel: 'UTM', cpc: 0.5, ctr: 1.8, conversions: 28, revenue: 1400, roi: 1200 },
      { channel: 'LinkedIn', cpc: 3.2, ctr: 1.5, conversions: 18, revenue: 3600, roi: 350 }
    ];

    res.json({
      data: roiMatrix,
      sortedByROI: [...roiMatrix].sort((a, b) => b.roi - a.roi)
    });
  } catch (error) {
    logger.error('Failed to fetch ROI matrix', { error });
    next(error);
  }
});

export default router;
