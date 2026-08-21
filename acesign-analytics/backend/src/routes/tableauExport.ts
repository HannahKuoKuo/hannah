import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import db from '../utils/db';

const router = Router();

interface TableauExportConfig {
  dataType: 'clv_analysis' | 'atest_results' | 'kpi_dashboard' | 'cohort_retention' | 'survival_curve' | 'campaign_roi';
  format: 'csv' | 'json' | 'tsv';
  dateRange?: string;
  filters?: Record<string, any>;
}

interface TableauDataset {
  rows: any[];
  columns: string[];
  metadata: {
    exportedAt: string;
    dataType: string;
    rowCount: number;
    exportedBy?: string;
  };
}

// Format data for Tableau ingestion (CSV export)
const formatAsCSV = (data: TableauDataset): string => {
  if (data.rows.length === 0) {
    return '';
  }

  // CSV header
  const header = data.columns.map(col => `"${col}"`).join(',');

  // CSV rows with proper escaping
  const rows = data.rows.map(row => {
    return data.columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',');
  });

  return [header, ...rows].join('\n');
};

// Format data as JSON for Tableau API
const formatAsJSON = (data: TableauDataset): string => {
  return JSON.stringify({
    data: data.rows,
    metadata: data.metadata,
    columns: data.columns
  }, null, 2);
};

// Format data as TSV (Tab-Separated Values)
const formatAsTSV = (data: TableauDataset): string => {
  if (data.rows.length === 0) {
    return '';
  }

  const header = data.columns.join('\t');
  const rows = data.rows.map(row => {
    return data.columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) {
        return '';
      }
      return String(value).replace(/\t/g, ' ');
    }).join('\t');
  });

  return [header, ...rows].join('\n');
};

// Get CLV analysis data for Tableau
const getCLVDataset = async (dateRange: string = 'last_90_days'): Promise<TableauDataset> => {
  // Mock CLV data
  const clvData = [
    { customer_id: 1, customer_name: 'John Smith', rfm_score: 4.5, clv: 1245.50, churn_risk: 15, segment: 'high_value', monthly_value: 125 },
    { customer_id: 2, customer_name: 'Sarah Johnson', rfm_score: 3.8, clv: 890.25, churn_risk: 25, segment: 'medium_value', monthly_value: 89 },
    { customer_id: 3, customer_name: 'Michael Chen', rfm_score: 4.2, clv: 1450.75, churn_risk: 20, segment: 'high_value', monthly_value: 145 },
    { customer_id: 4, customer_name: 'Emma Wilson', rfm_score: 2.1, clv: 320.00, churn_risk: 65, segment: 'low_value', monthly_value: 32 },
    { customer_id: 5, customer_name: 'David Brown', rfm_score: 3.5, clv: 725.50, churn_risk: 35, segment: 'medium_value', monthly_value: 73 }
  ];

  return {
    rows: clvData,
    columns: ['customer_id', 'customer_name', 'rfm_score', 'clv', 'churn_risk', 'segment', 'monthly_value'],
    metadata: {
      exportedAt: new Date().toISOString(),
      dataType: 'clv_analysis',
      rowCount: clvData.length
    }
  };
};

// Get A/B test results for Tableau
const getABTestDataset = async (): Promise<TableauDataset> => {
  const abtestData = [
    { test_id: 1, test_name: 'Email Subject Line Test', variant: 'Control', visits: 5000, conversions: 450, conversion_rate: 9.0, lift: 0, p_value: null },
    { test_id: 1, test_name: 'Email Subject Line Test', variant: 'With Emoji', visits: 5100, conversions: 540, conversion_rate: 10.59, lift: 17.7, p_value: 0.0234 },
    { test_id: 2, test_name: 'Landing Page CTA Button', variant: 'Red Button', visits: 3200, conversions: 320, conversion_rate: 10.0, lift: 0, p_value: null },
    { test_id: 2, test_name: 'Landing Page CTA Button', variant: 'Green Button', visits: 3150, conversions: 380, conversion_rate: 12.06, lift: 20.6, p_value: 0.0156 },
    { test_id: 3, test_name: 'Ad Copy Variation', variant: 'Feature-Focused', visits: 2800, conversions: 280, conversion_rate: 10.0, lift: 0, p_value: null },
    { test_id: 3, test_name: 'Ad Copy Variation', variant: 'Benefit-Focused', visits: 2900, conversions: 350, conversion_rate: 12.07, lift: 20.7, p_value: 0.0089 }
  ];

  return {
    rows: abtestData,
    columns: ['test_id', 'test_name', 'variant', 'visits', 'conversions', 'conversion_rate', 'lift', 'p_value'],
    metadata: {
      exportedAt: new Date().toISOString(),
      dataType: 'atest_results',
      rowCount: abtestData.length
    }
  };
};

// Get KPI dashboard data for Tableau
const getKPIDataset = async (): Promise<TableauDataset> => {
  const kpiData = [
    { kpi_id: 1, kpi_name: 'Customer Acquisition Cost', category: 'acquisition', current_value: 42.50, target_value: 40.00, status: 'healthy', trend: -3.5 },
    { kpi_id: 2, kpi_name: 'Customer Lifetime Value', category: 'retention', current_value: 1250.00, target_value: 1500.00, status: 'healthy', trend: 2.1 },
    { kpi_id: 3, kpi_name: 'Conversion Rate', category: 'conversion', current_value: 3.45, target_value: 4.00, status: 'healthy', trend: 5.2 },
    { kpi_id: 4, kpi_name: 'Return on Ad Spend', category: 'efficiency', current_value: 3.20, target_value: 4.00, status: 'healthy', trend: -8.3 },
    { kpi_id: 5, kpi_name: 'Email Open Rate', category: 'engagement', current_value: 28.5, target_value: 30.00, status: 'healthy', trend: 1.8 },
    { kpi_id: 6, kpi_name: 'Churn Rate', category: 'retention', current_value: 5.2, target_value: 3.00, status: 'warning', trend: -2.1 }
  ];

  return {
    rows: kpiData,
    columns: ['kpi_id', 'kpi_name', 'category', 'current_value', 'target_value', 'status', 'trend'],
    metadata: {
      exportedAt: new Date().toISOString(),
      dataType: 'kpi_dashboard',
      rowCount: kpiData.length
    }
  };
};

// Get cohort retention data for Tableau
const getCohortRetentionDataset = async (): Promise<TableauDataset> => {
  const cohortData = [
    { cohort_month: '2024-04', cohort_size: 450, month_0: 100, month_1: 78, month_2: 65, month_3: 52, month_4: 43 },
    { cohort_month: '2024-05', cohort_size: 520, month_0: 100, month_1: 82, month_2: 70, month_3: 58, month_4: null },
    { cohort_month: '2024-06', cohort_size: 480, month_0: 100, month_1: 85, month_2: 73, month_3: null, month_4: null },
    { cohort_month: '2024-07', cohort_size: 510, month_0: 100, month_1: 88, month_2: null, month_3: null, month_4: null },
    { cohort_month: '2024-08', cohort_size: 495, month_0: 100, month_1: null, month_2: null, month_3: null, month_4: null }
  ];

  return {
    rows: cohortData,
    columns: ['cohort_month', 'cohort_size', 'month_0', 'month_1', 'month_2', 'month_3', 'month_4'],
    metadata: {
      exportedAt: new Date().toISOString(),
      dataType: 'cohort_retention',
      rowCount: cohortData.length
    }
  };
};

// Get survival curve data for Tableau
const getSurvivalCurveDataset = async (): Promise<TableauDataset> => {
  const survivalData = [
    { time_period: 0, survival_rate: 100, event_count: 0, at_risk: 1000 },
    { time_period: 1, survival_rate: 92.5, event_count: 75, at_risk: 925 },
    { time_period: 2, survival_rate: 85.8, event_count: 65, at_risk: 858 },
    { time_period: 3, survival_rate: 79.2, event_count: 60, at_risk: 792 },
    { time_period: 4, survival_rate: 73.5, event_count: 55, at_risk: 735 },
    { time_period: 5, survival_rate: 68.1, event_count: 50, at_risk: 681 },
    { time_period: 6, survival_rate: 63.2, event_count: 48, at_risk: 632 }
  ];

  return {
    rows: survivalData,
    columns: ['time_period', 'survival_rate', 'event_count', 'at_risk'],
    metadata: {
      exportedAt: new Date().toISOString(),
      dataType: 'survival_curve',
      rowCount: survivalData.length
    }
  };
};

// Get campaign ROI data for Tableau
const getCampaignROIDataset = async (): Promise<TableauDataset> => {
  const roiData = [
    { campaign_id: 1, campaign_name: 'Summer Sale', channel: 'Email', spend: 5000, revenue: 15000, roas: 3.0, cac: 25, conversions: 200 },
    { campaign_id: 2, campaign_name: 'Summer Sale', channel: 'Facebook', spend: 8000, revenue: 24000, roas: 3.0, cac: 40, conversions: 200 },
    { campaign_id: 3, campaign_name: 'Fall Promotion', channel: 'Email', spend: 3500, revenue: 10500, roas: 3.0, cac: 21, conversions: 167 },
    { campaign_id: 4, campaign_name: 'Fall Promotion', channel: 'LinkedIn', spend: 6500, revenue: 19500, roas: 3.0, cac: 39, conversions: 167 },
    { campaign_id: 5, campaign_name: 'Holiday Special', channel: 'Instagram', spend: 9000, revenue: 28500, roas: 3.17, cac: 32, conversions: 281 }
  ];

  return {
    rows: roiData,
    columns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'revenue', 'roas', 'cac', 'conversions'],
    metadata: {
      exportedAt: new Date().toISOString(),
      dataType: 'campaign_roi',
      rowCount: roiData.length
    }
  };
};

// Route: Export data for Tableau
router.post('/export', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { dataType, format = 'csv', dateRange = 'last_90_days' } = req.body as TableauExportConfig;

    if (!dataType) {
      const error: AppError = new Error('dataType is required');
      error.statusCode = 400;
      throw error;
    }

    if (!['csv', 'json', 'tsv'].includes(format)) {
      const error: AppError = new Error('format must be csv, json, or tsv');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Exporting ${dataType} as ${format} for user ${userId}`);

    let dataset: TableauDataset;

    // Get dataset based on type
    switch (dataType) {
      case 'clv_analysis':
        dataset = await getCLVDataset(dateRange);
        break;
      case 'atest_results':
        dataset = await getABTestDataset();
        break;
      case 'kpi_dashboard':
        dataset = await getKPIDataset();
        break;
      case 'cohort_retention':
        dataset = await getCohortRetentionDataset();
        break;
      case 'survival_curve':
        dataset = await getSurvivalCurveDataset();
        break;
      case 'campaign_roi':
        dataset = await getCampaignROIDataset();
        break;
      default:
        const error: AppError = new Error(`Unknown dataType: ${dataType}`);
        error.statusCode = 400;
        throw error;
    }

    // Format data
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        content = formatAsCSV(dataset);
        mimeType = 'text/csv';
        filename = `${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'json':
        content = formatAsJSON(dataset);
        mimeType = 'application/json';
        filename = `${dataType}_${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'tsv':
        content = formatAsTSV(dataset);
        mimeType = 'text/tab-separated-values';
        filename = `${dataType}_${new Date().toISOString().split('T')[0]}.tsv`;
        break;
      default:
        throw new Error('Unsupported format');
    }

    // Set response headers for file download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(content));

    res.send(content);
  } catch (error) {
    logger.error('Tableau export failed', { error });
    next(error);
  }
});

// Route: Get available export types
router.get('/types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportTypes = [
      {
        id: 'clv_analysis',
        name: 'CLV Analysis',
        description: 'Customer Lifetime Value with RFM scores and churn risk',
        useCase: 'Customer segmentation and retention strategy'
      },
      {
        id: 'atest_results',
        name: 'A/B Test Results',
        description: 'Statistical test results with lift and p-values',
        useCase: 'Test result analysis and winner determination'
      },
      {
        id: 'kpi_dashboard',
        name: 'KPI Dashboard',
        description: 'All marketing KPIs with trends and status',
        useCase: 'Executive reporting and KPI tracking'
      },
      {
        id: 'cohort_retention',
        name: 'Cohort Retention',
        description: 'User retention rates by cohort and time period',
        useCase: 'Retention analysis and cohort benchmarking'
      },
      {
        id: 'survival_curve',
        name: 'Survival Curve',
        description: 'Kaplan-Meier survival analysis data',
        useCase: 'Customer lifetime estimation'
      },
      {
        id: 'campaign_roi',
        name: 'Campaign ROI',
        description: 'ROI, CAC, and performance by campaign and channel',
        useCase: 'Marketing efficiency and budget allocation'
      }
    ];

    res.json({
      types: exportTypes,
      formats: ['csv', 'json', 'tsv'],
      recommendedFormat: 'csv',
      tableauVersion: '2024.2+'
    });
  } catch (error) {
    logger.error('Failed to get export types', { error });
    next(error);
  }
});

// Route: Get Tableau connection guide
router.get('/guide', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guide = {
      title: 'ACE Analytics to Tableau Integration Guide',
      methods: [
        {
          method: 'CSV Export (Recommended)',
          steps: [
            '1. Call POST /api/tableau/export with desired dataType and format',
            '2. Download CSV file from response',
            '3. In Tableau Desktop: File → Open Data → Select CSV file',
            '4. Drag tables to canvas to build visualizations',
            '5. Publish to Tableau Server if needed'
          ],
          pros: ['Simple', 'No authentication required in Tableau', 'Works offline'],
          cons: ['Manual refresh needed', 'No real-time updates']
        },
        {
          method: 'Direct Database Connection',
          steps: [
            '1. Ensure PostgreSQL is running',
            '2. In Tableau Server: Create new data source',
            '3. Select PostgreSQL connector',
            '4. Enter connection details:',
            '   - Host: localhost',
            '   - Port: 5432',
            '   - Database: acesign_analytics',
            '   - Username: postgres',
            '   - Password: [your password]',
            '5. Select tables: events, customers, analytics_results',
            '6. Build visualizations with live data'
          ],
          pros: ['Real-time data', 'Automatic refresh', 'No file management'],
          cons: ['Requires network access', 'Need DB credentials']
        }
      ],
      dashboardTemplates: [
        {
          name: 'Marketing Performance Overview',
          dataTypes: ['kpi_dashboard', 'campaign_roi'],
          visualizations: ['KPI cards', 'Campaign ROI trend', 'Channel comparison']
        },
        {
          name: 'A/B Testing Results',
          dataTypes: ['atest_results'],
          visualizations: ['Test comparison', 'Lift bar chart', 'Significance indicator']
        },
        {
          name: 'Customer Health',
          dataTypes: ['clv_analysis', 'cohort_retention', 'survival_curve'],
          visualizations: ['CLV distribution', 'Retention heatmap', 'Survival curve']
        }
      ]
    };

    res.json(guide);
  } catch (error) {
    logger.error('Failed to get Tableau guide', { error });
    next(error);
  }
});

export default router;
