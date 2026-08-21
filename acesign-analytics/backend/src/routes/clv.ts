import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import db from '../utils/db';

const router = Router();

interface Customer {
  id: number;
  name: string;
  email: string;
  acquisition_date: string;
  last_purchase_date: string;
  total_revenue: number;
  purchase_count: number;
  avg_order_value: number;
  churn_risk: number;
}

interface CLVAnalysis {
  customers: Customer[];
  summary: {
    totalCustomers: number;
    avgCLV: number;
    medianCLV: number;
    totalRevenue: number;
    cohortSize: number;
  };
}

interface CohortMetrics {
  month: string;
  cohortSize: number;
  retention_0: number;
  retention_1: number;
  retention_2: number;
  retention_3: number;
  retention_4: number;
  retention_5: number;
  retention_6: number;
  avg_revenue_per_user: number;
}

// Calculate Customer Lifetime Value using RFM (Recency, Frequency, Monetary) + predictive model
const calculateCLV = (customer: any) => {
  const months = Math.max(1, Math.floor((Date.now() - new Date(customer.acquisition_date).getTime()) / (30 * 24 * 60 * 60 * 1000)));

  // RFM scores (1-5 scale)
  const recency = Math.min(5, Math.max(1, 5 - Math.floor((Date.now() - new Date(customer.last_purchase_date).getTime()) / (30 * 24 * 60 * 60 * 1000)) / 12));
  const frequency = Math.min(5, Math.max(1, Math.floor(customer.purchase_count / 10)));
  const monetary = Math.min(5, Math.max(1, Math.floor(customer.avg_order_value / 100)));

  const rfmScore = (recency + frequency + monetary) / 3;

  // Predict CLV based on historical data
  const avgMonthlyRevenue = customer.total_revenue / Math.max(1, months);
  const customerAge = months;
  const predictedLifetime = 36; // 36 month prediction window

  // Churn probability based on recency
  const churnProbability = Math.max(0, Math.min(1, (12 - recency) / 12));

  // Adjusted CLV = predicted monthly revenue * remaining lifetime * (1 - churn probability)
  const remainingMonths = Math.max(0, predictedLifetime - customerAge);
  let clv = avgMonthlyRevenue * remainingMonths * (1 - churnProbability);

  // Ensure CLV is never negative (negative CLV is nonsensical)
  clv = Math.max(0, clv);

  return {
    clv: Math.round(clv * 100) / 100,
    rfmScore: Math.round(rfmScore * 10) / 10,
    churnRisk: Math.round(churnProbability * 100),
    predictedLifetime: remainingMonths,
    monthlyValue: Math.round(avgMonthlyRevenue * 100) / 100
  };
};

// Segment customers by CLV tier
const segmentCustomers = (customers: any[]) => {
  const clvValues = customers.map(c => calculateCLV(c).clv).sort((a, b) => b - a);
  const p33 = clvValues[Math.floor(clvValues.length / 3)];
  const p67 = clvValues[Math.floor((clvValues.length * 2) / 3)];

  return {
    high: customers.filter(c => calculateCLV(c).clv >= p67),
    medium: customers.filter(c => {
      const clv = calculateCLV(c).clv;
      return clv < p67 && clv >= p33;
    }),
    low: customers.filter(c => calculateCLV(c).clv < p33)
  };
};

// Get CLV analysis with customer segmentation
router.get('/analysis', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { days = 90, segment } = req.query;

    logger.info(`Fetching CLV analysis for user ${userId}`);

    // Mock customer data
    const mockCustomers: Customer[] = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john@example.com',
        acquisition_date: '2024-03-15',
        last_purchase_date: '2024-08-18',
        total_revenue: 2450,
        purchase_count: 7,
        avg_order_value: 350,
        churn_risk: 15
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        acquisition_date: '2024-05-22',
        last_purchase_date: '2024-08-15',
        total_revenue: 1820,
        purchase_count: 5,
        avg_order_value: 364,
        churn_risk: 25
      },
      {
        id: 3,
        name: 'Michael Chen',
        email: 'michael@example.com',
        acquisition_date: '2024-02-10',
        last_purchase_date: '2024-08-10',
        total_revenue: 3680,
        purchase_count: 10,
        avg_order_value: 368,
        churn_risk: 20
      },
      {
        id: 4,
        name: 'Emma Wilson',
        email: 'emma@example.com',
        acquisition_date: '2024-07-01',
        last_purchase_date: '2024-08-05',
        total_revenue: 450,
        purchase_count: 1,
        avg_order_value: 450,
        churn_risk: 65
      },
      {
        id: 5,
        name: 'David Brown',
        email: 'david@example.com',
        acquisition_date: '2024-01-20',
        last_purchase_date: '2024-08-20',
        total_revenue: 5200,
        purchase_count: 15,
        avg_order_value: 347,
        churn_risk: 10
      },
      {
        id: 6,
        name: 'Lisa Anderson',
        email: 'lisa@example.com',
        acquisition_date: '2024-04-05',
        last_purchase_date: '2024-06-30',
        total_revenue: 1200,
        purchase_count: 3,
        avg_order_value: 400,
        churn_risk: 55
      }
    ];

    const enrichedCustomers = mockCustomers.map(c => {
      const clvData = calculateCLV(c);
      return {
        ...c,
        clv: clvData.clv,
        rfmScore: clvData.rfmScore,
        predictedLifetime: clvData.predictedLifetime,
        monthlyValue: clvData.monthlyValue
      };
    });

    let filtered = enrichedCustomers;

    if (segment === 'high') {
      const avg = enrichedCustomers.reduce((sum, c) => sum + c.clv, 0) / enrichedCustomers.length;
      filtered = enrichedCustomers.filter(c => c.clv >= avg);
    } else if (segment === 'medium') {
      const avg = enrichedCustomers.reduce((sum, c) => sum + c.clv, 0) / enrichedCustomers.length;
      const min = Math.min(...enrichedCustomers.map(c => c.clv));
      filtered = enrichedCustomers.filter(c => c.clv < avg && c.clv >= min + (avg - min) / 2);
    } else if (segment === 'low') {
      const avg = enrichedCustomers.reduce((sum, c) => sum + c.clv, 0) / enrichedCustomers.length;
      const min = Math.min(...enrichedCustomers.map(c => c.clv));
      filtered = enrichedCustomers.filter(c => c.clv < min + (avg - min) / 2);
    }

    const totalRevenue = filtered.reduce((sum, c) => sum + c.total_revenue, 0);
    const avgCLV = filtered.length > 0 ? filtered.reduce((sum, c) => sum + c.clv, 0) / filtered.length : 0;
    const clvValues = filtered.map(c => c.clv).sort((a, b) => a - b);
    const medianCLV = clvValues[Math.floor(clvValues.length / 2)];

    res.json({
      customers: filtered,
      summary: {
        totalCustomers: filtered.length,
        avgCLV: Math.round(avgCLV * 100) / 100,
        medianCLV: Math.round(medianCLV * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        cohortSize: enrichedCustomers.length
      }
    });
  } catch (error) {
    logger.error('Failed to fetch CLV analysis', { error });
    next(error);
  }
});

// Get cohort analysis
router.get('/cohort', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    logger.info(`Fetching cohort analysis for user ${userId}`);

    // Mock cohort data
    const mockCohorts: CohortMetrics[] = [
      {
        month: '2024-01',
        cohortSize: 48,
        retention_0: 100,
        retention_1: 85,
        retention_2: 72,
        retention_3: 68,
        retention_4: 65,
        retention_5: 62,
        retention_6: 58,
        avg_revenue_per_user: 450
      },
      {
        month: '2024-02',
        cohortSize: 52,
        retention_0: 100,
        retention_1: 82,
        retention_2: 70,
        retention_3: 66,
        retention_4: 63,
        retention_5: 60,
        retention_6: 0,
        avg_revenue_per_user: 425
      },
      {
        month: '2024-03',
        cohortSize: 61,
        retention_0: 100,
        retention_1: 88,
        retention_2: 76,
        retention_3: 71,
        retention_4: 68,
        retention_5: 0,
        retention_6: 0,
        avg_revenue_per_user: 475
      },
      {
        month: '2024-04',
        cohortSize: 55,
        retention_0: 100,
        retention_1: 83,
        retention_2: 73,
        retention_3: 69,
        retention_4: 0,
        retention_5: 0,
        retention_6: 0,
        avg_revenue_per_user: 440
      },
      {
        month: '2024-05',
        cohortSize: 58,
        retention_0: 100,
        retention_1: 86,
        retention_2: 75,
        retention_3: 0,
        retention_4: 0,
        retention_5: 0,
        retention_6: 0,
        avg_revenue_per_user: 460
      },
      {
        month: '2024-06',
        cohortSize: 64,
        retention_0: 100,
        retention_1: 84,
        retention_2: 0,
        retention_3: 0,
        retention_4: 0,
        retention_5: 0,
        retention_6: 0,
        avg_revenue_per_user: 430
      }
    ];

    res.json({
      cohorts: mockCohorts
    });
  } catch (error) {
    logger.error('Failed to fetch cohort analysis', { error });
    next(error);
  }
});

// Get survival curves
router.get('/survival', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    logger.info(`Fetching survival curves for user ${userId}`);

    // Mock survival data
    const mockSurvivalData = [
      { month: 0, overall: 100, high_value: 100, medium_value: 100, low_value: 100 },
      { month: 1, overall: 84, high_value: 94, medium_value: 85, low_value: 70 },
      { month: 2, overall: 73, high_value: 88, medium_value: 74, low_value: 55 },
      { month: 3, overall: 68, high_value: 85, medium_value: 69, low_value: 48 },
      { month: 4, overall: 65, high_value: 83, medium_value: 66, low_value: 42 },
      { month: 5, overall: 62, high_value: 80, medium_value: 63, low_value: 38 },
      { month: 6, overall: 58, high_value: 77, medium_value: 59, low_value: 32 }
    ];

    res.json({
      survival: mockSurvivalData
    });
  } catch (error) {
    logger.error('Failed to fetch survival curves', { error });
    next(error);
  }
});

// Get customer segmentation
router.get('/segments', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    logger.info(`Fetching customer segments for user ${userId}`);

    // Mock segmentation data
    const mockSegments = {
      champions: {
        size: 15,
        percentage: 25,
        avg_clv: 4250,
        retention_rate: 92,
        avg_order_frequency: 8.5,
        roas: 4.2
      },
      loyal: {
        size: 18,
        percentage: 30,
        avg_clv: 2100,
        retention_rate: 78,
        avg_order_frequency: 4.2,
        roas: 2.8
      },
      at_risk: {
        size: 14,
        percentage: 23,
        avg_clv: 850,
        retention_rate: 35,
        avg_order_frequency: 1.5,
        roas: 0.9
      },
      new: {
        size: 13,
        percentage: 22,
        avg_clv: 450,
        retention_rate: 60,
        avg_order_frequency: 1.0,
        roas: 1.5
      }
    };

    res.json({
      segments: mockSegments
    });
  } catch (error) {
    logger.error('Failed to fetch segments', { error });
    next(error);
  }
});

// Get churn prediction
router.get('/churn-prediction', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    logger.info(`Fetching churn prediction for user ${userId}`);

    // Mock churn prediction
    const mockChurnPrediction = {
      high_risk: [
        { id: 4, name: 'Emma Wilson', email: 'emma@example.com', churn_probability: 0.65, days_inactive: 76, recommendation: 'Win-back campaign' },
        { id: 6, name: 'Lisa Anderson', email: 'lisa@example.com', churn_probability: 0.55, days_inactive: 51, recommendation: 'Discount offer' }
      ],
      medium_risk: [
        { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', churn_probability: 0.25, days_inactive: 36, recommendation: 'Engagement email' },
        { id: 3, name: 'Michael Chen', email: 'michael@example.com', churn_probability: 0.20, days_inactive: 41, recommendation: 'Product recommendation' }
      ],
      low_risk: [
        { id: 1, name: 'John Smith', email: 'john@example.com', churn_probability: 0.15, days_inactive: 3, recommendation: 'Cross-sell' },
        { id: 5, name: 'David Brown', email: 'david@example.com', churn_probability: 0.10, days_inactive: 1, recommendation: 'VIP treatment' }
      ]
    };

    res.json({
      prediction: mockChurnPrediction,
      summary: {
        totalCustomers: 6,
        high_risk_count: 2,
        medium_risk_count: 2,
        low_risk_count: 2,
        avg_churn_risk: 0.35
      }
    });
  } catch (error) {
    logger.error('Failed to fetch churn prediction', { error });
    next(error);
  }
});

// Get CLV distribution
router.get('/distribution', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    logger.info(`Fetching CLV distribution for user ${userId}`);

    // Mock CLV distribution (for histogram)
    const mockDistribution = [
      { range: '$0-500', count: 8, percentage: 13 },
      { range: '$500-1000', count: 12, percentage: 20 },
      { range: '$1000-2000', count: 18, percentage: 30 },
      { range: '$2000-3000', count: 15, percentage: 25 },
      { range: '$3000+', count: 9, percentage: 12 }
    ];

    res.json({
      distribution: mockDistribution,
      summary: {
        mean: 1580,
        median: 1450,
        stdDev: 850,
        skewness: 0.85
      }
    });
  } catch (error) {
    logger.error('Failed to fetch CLV distribution', { error });
    next(error);
  }
});

export default router;
