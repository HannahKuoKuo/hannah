import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import db from '../utils/db';

const router = Router();

interface KPI {
  id: number;
  name: string;
  description: string;
  category: string;
  formula: string;
  current_value: number;
  target_value: number;
  threshold_warning: number;
  threshold_critical: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  last_updated: string;
  trend: number; // percentage change
  direction?: 'higher' | 'lower'; // whether higher or lower is better
}

interface KPIAlert {
  id: number;
  kpi_id: number;
  severity: 'warning' | 'critical';
  message: string;
  triggered_at: string;
  resolved: boolean;
}

interface KPIHistory {
  timestamp: string;
  value: number;
  target: number;
}

// Determine KPI status based on thresholds and direction (higher/lower is better)
const determineStatus = (value: number, warning: number, critical: number, direction: 'higher' | 'lower' = 'higher'): 'healthy' | 'warning' | 'critical' => {
  if (direction === 'higher') {
    // For metrics where higher is better (conversion rate, open rate, ROAS, CLV)
    if (value <= critical) return 'critical';
    if (value <= warning) return 'warning';
    return 'healthy';
  } else {
    // For metrics where lower is better (CAC, churn rate)
    if (value >= critical) return 'critical';
    if (value >= warning) return 'warning';
    return 'healthy';
  }
};

// Calculate trend (percentage change from previous period)
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Get all KPIs for user
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { category } = req.query;

    logger.info(`Fetching KPIs for user ${userId}`);

    // Mock KPI data
    const mockKPIs: KPI[] = [
      {
        id: 1,
        name: 'Customer Acquisition Cost',
        description: 'Average cost to acquire one customer',
        category: 'acquisition',
        formula: 'total_marketing_spend / new_customers',
        current_value: 42.50,
        target_value: 40.00,
        threshold_warning: 45.00,
        threshold_critical: 50.00,
        unit: '$',
        direction: 'lower',
        status: determineStatus(42.50, 45.00, 50.00, 'lower'),
        last_updated: new Date().toISOString(),
        trend: -3.5
      },
      {
        id: 2,
        name: 'Customer Lifetime Value',
        description: 'Total revenue from a customer over lifetime',
        category: 'retention',
        formula: 'avg_customer_revenue * customer_lifetime_months',
        current_value: 1250.00,
        target_value: 1500.00,
        threshold_warning: 1100.00,
        threshold_critical: 1000.00,
        unit: '$',
        direction: 'higher',
        status: determineStatus(1250.00, 1100.00, 1000.00, 'higher'),
        last_updated: new Date().toISOString(),
        trend: 2.1
      },
      {
        id: 3,
        name: 'Conversion Rate',
        description: 'Percentage of visitors who convert',
        category: 'conversion',
        formula: 'conversions / visitors * 100',
        current_value: 3.45,
        target_value: 4.00,
        threshold_warning: 3.00,
        threshold_critical: 2.50,
        unit: '%',
        direction: 'higher',
        status: determineStatus(3.45, 3.00, 2.50, 'higher'),
        last_updated: new Date().toISOString(),
        trend: 5.2
      },
      {
        id: 4,
        name: 'Return on Ad Spend',
        description: 'Revenue generated per dollar spent on ads',
        category: 'efficiency',
        formula: 'revenue_from_ads / ad_spend',
        current_value: 3.20,
        target_value: 4.00,
        threshold_warning: 2.50,
        threshold_critical: 2.00,
        unit: 'x',
        direction: 'higher',
        status: determineStatus(3.20, 2.50, 2.00, 'higher'),
        last_updated: new Date().toISOString(),
        trend: -8.3
      },
      {
        id: 5,
        name: 'Email Open Rate',
        description: 'Percentage of recipients who open emails',
        category: 'engagement',
        formula: 'email_opens / email_sent * 100',
        current_value: 28.5,
        target_value: 30.00,
        threshold_warning: 25.00,
        threshold_critical: 20.00,
        unit: '%',
        direction: 'higher',
        status: determineStatus(28.5, 25.00, 20.00, 'higher'),
        last_updated: new Date().toISOString(),
        trend: 1.8
      },
      {
        id: 6,
        name: 'Churn Rate',
        description: 'Percentage of customers who leave each month',
        category: 'retention',
        formula: 'customers_lost / starting_customers * 100',
        current_value: 5.2,
        target_value: 3.00,
        threshold_warning: 6.00,
        threshold_critical: 8.00,
        unit: '%',
        direction: 'lower',
        status: determineStatus(5.2, 6.00, 8.00, 'lower'),
        last_updated: new Date().toISOString(),
        trend: -2.1
      }
    ];

    let filtered = mockKPIs;
    if (category) {
      filtered = filtered.filter(k => k.category === category);
    }

    res.json({
      data: filtered,
      summary: {
        total_kpis: filtered.length,
        healthy: filtered.filter(k => k.status === 'healthy').length,
        warning: filtered.filter(k => k.status === 'warning').length,
        critical: filtered.filter(k => k.status === 'critical').length
      }
    });
  } catch (error) {
    logger.error('Failed to fetch KPIs', { error });
    next(error);
  }
});

// Get single KPI with history
router.get('/:kpiId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { kpiId } = req.params;

    logger.info(`Fetching KPI ${kpiId} for user ${userId}`);

    // Mock KPI history
    const mockHistory: KPIHistory[] = [
      { timestamp: '2024-07-20', value: 44.0, target: 40.0 },
      { timestamp: '2024-07-27', value: 43.5, target: 40.0 },
      { timestamp: '2024-08-03', value: 43.0, target: 40.0 },
      { timestamp: '2024-08-10', value: 42.8, target: 40.0 },
      { timestamp: '2024-08-17', value: 42.50, target: 40.0 },
      { timestamp: '2024-08-21', value: 42.50, target: 40.0 }
    ];

    const kpi: KPI = {
      id: parseInt(kpiId),
      name: 'Customer Acquisition Cost',
      description: 'Average cost to acquire one customer',
      category: 'acquisition',
      formula: 'total_marketing_spend / new_customers',
      current_value: 42.50,
      target_value: 40.00,
      threshold_warning: 45.00,
      threshold_critical: 50.00,
      unit: '$',
      status: 'healthy',
      last_updated: new Date().toISOString(),
      trend: -3.5
    };

    res.json({
      kpi,
      history: mockHistory,
      comparison: {
        vs_target: ((kpi.current_value - kpi.target_value) / kpi.target_value * 100).toFixed(2) + '%',
        vs_previous_period: kpi.trend.toFixed(2) + '%'
      }
    });
  } catch (error) {
    logger.error('Failed to fetch KPI', { error });
    next(error);
  }
});

// Create new KPI
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { name, description, category, formula, target_value, threshold_warning, threshold_critical, unit } = req.body;

    if (!name || !formula || !category) {
      const error: AppError = new Error('Name, formula, and category are required');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Creating KPI "${name}" for user ${userId}`);

    const kpiId = Math.floor(Math.random() * 10000);

    res.status(201).json({
      message: 'KPI created successfully',
      kpi: {
        id: kpiId,
        name,
        description,
        category,
        formula,
        target_value,
        threshold_warning,
        threshold_critical,
        unit,
        status: 'healthy',
        current_value: 0,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to create KPI', { error });
    next(error);
  }
});

// Update KPI
router.put('/:kpiId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { kpiId } = req.params;
    const { name, description, formula, target_value, threshold_warning, threshold_critical } = req.body;

    logger.info(`Updating KPI ${kpiId} for user ${userId}`);

    res.json({
      message: 'KPI updated',
      kpi: {
        id: parseInt(kpiId),
        name,
        description,
        formula,
        target_value,
        threshold_warning,
        threshold_critical,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to update KPI', { error });
    next(error);
  }
});

// Delete KPI
router.delete('/:kpiId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { kpiId } = req.params;

    logger.info(`Deleting KPI ${kpiId} for user ${userId}`);

    res.json({
      message: 'KPI deleted',
      kpiId
    });
  } catch (error) {
    logger.error('Failed to delete KPI', { error });
    next(error);
  }
});

// Get KPI alerts
router.get('/:kpiId/alerts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { kpiId } = req.params;

    logger.info(`Fetching alerts for KPI ${kpiId}`);

    const mockAlerts: KPIAlert[] = [
      {
        id: 1,
        kpi_id: parseInt(kpiId),
        severity: 'warning',
        message: 'KPI below target by 5%',
        triggered_at: '2024-08-21 14:30:00',
        resolved: false
      },
      {
        id: 2,
        kpi_id: parseInt(kpiId),
        severity: 'warning',
        message: 'KPI trending downward for 3 consecutive days',
        triggered_at: '2024-08-20 09:15:00',
        resolved: false
      }
    ];

    res.json({
      data: mockAlerts,
      active: mockAlerts.filter(a => !a.resolved).length,
      total: mockAlerts.length
    });
  } catch (error) {
    logger.error('Failed to fetch KPI alerts', { error });
    next(error);
  }
});

// Set alert thresholds
router.post('/:kpiId/alerts/configure', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { kpiId } = req.params;
    const { threshold_warning, threshold_critical, notification_channels } = req.body;

    logger.info(`Configuring alerts for KPI ${kpiId}`);

    res.json({
      message: 'Alert thresholds configured',
      config: {
        kpi_id: parseInt(kpiId),
        threshold_warning,
        threshold_critical,
        notification_channels,
        enabled: true,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to configure alerts', { error });
    next(error);
  }
});

// Get KPI dashboard summary
router.get('/dashboard/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    logger.info(`Fetching KPI dashboard for user ${userId}`);

    const mockDashboard = {
      summary: {
        total_kpis: 6,
        healthy: 3,
        warning: 2,
        critical: 1,
        alerts_active: 8,
        alerts_resolved_today: 3
      },
      top_performers: [
        { id: 3, name: 'Conversion Rate', value: 3.45, trend: 5.2 },
        { id: 5, name: 'Email Open Rate', value: 28.5, trend: 1.8 }
      ],
      needs_attention: [
        { id: 4, name: 'Return on Ad Spend', value: 3.20, target: 4.00, gap: -20 },
        { id: 2, name: 'Customer Lifetime Value', value: 1250, target: 1500, gap: -16.7 }
      ],
      recent_alerts: [
        { kpi: 'ROAS', severity: 'warning', time: '2 hours ago' },
        { kpi: 'Churn Rate', severity: 'warning', time: '4 hours ago' }
      ],
      forecast: {
        next_period_prediction: 'Slight improvement expected',
        confidence: 75
      }
    };

    res.json(mockDashboard);
  } catch (error) {
    logger.error('Failed to fetch KPI dashboard', { error });
    next(error);
  }
});

// Get KPI comparison (period over period)
router.get('/analytics/comparison', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { period = 'monthly' } = req.query;

    logger.info(`Fetching KPI comparison for user ${userId}`);

    const mockComparison = [
      { kpi: 'CAC', current: 42.50, previous: 43.80, change: -3.0, target: 40.00 },
      { kpi: 'CLV', current: 1250, previous: 1225, change: 2.0, target: 1500 },
      { kpi: 'Conversion Rate', current: 3.45, previous: 3.28, change: 5.2, target: 4.00 },
      { kpi: 'ROAS', current: 3.20, previous: 3.48, change: -8.0, target: 4.00 },
      { kpi: 'Email Open Rate', current: 28.5, previous: 27.98, change: 1.9, target: 30.00 },
      { kpi: 'Churn Rate', current: 5.2, previous: 5.31, change: -2.1, target: 3.00 }
    ];

    res.json({
      period,
      data: mockComparison,
      improving: mockComparison.filter(k => k.change > 0).length,
      declining: mockComparison.filter(k => k.change < 0).length
    });
  } catch (error) {
    logger.error('Failed to fetch KPI comparison', { error });
    next(error);
  }
});

export default router;
