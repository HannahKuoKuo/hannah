import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import db from '../utils/db';

const router = Router();

interface PythonScript {
  id: number;
  name: string;
  description: string;
  code: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  status: 'draft' | 'published' | 'archived';
  execution_time?: number;
  last_run?: string;
}

interface AnalyticsResult {
  id: number;
  script_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: any;
  output: string;
  error?: string;
  created_at: string;
  execution_time: number;
}

// Validate Python code for safety
const validatePythonCode = (code: string): { valid: boolean; error?: string } => {
  const dangerousPatterns = [
    'import os',
    'import subprocess',
    'exec(',
    'eval(',
    '__import__',
    'open(',
    'compile(',
    'globals()',
    'locals()',
    'vars()'
  ];

  const codeUpper = code.toLowerCase();

  for (const pattern of dangerousPatterns) {
    if (codeUpper.includes(pattern.toLowerCase())) {
      return { valid: false, error: `Pattern '${pattern}' is not allowed for security reasons` };
    }
  }

  if (code.length > 50000) {
    return { valid: false, error: 'Script too large (max 50KB)' };
  }

  return { valid: true };
};

// Execute Python script (mock implementation)
const executePythonScript = async (code: string, data?: any): Promise<{
  output: any;
  logs: string;
  executionTime: number;
}> => {
  const startTime = Date.now();

  // Mock execution - in production would use Python subprocess with sandbox
  let output = {
    status: 'success',
    message: 'Script executed successfully',
    data: {
      summary_stats: {
        mean: 45.5,
        median: 42.0,
        std_dev: 12.3,
        min: 12,
        max: 98
      },
      trends: [
        { month: '2024-01', value: 35.2 },
        { month: '2024-02', value: 38.5 },
        { month: '2024-03', value: 41.2 },
        { month: '2024-04', value: 39.8 },
        { month: '2024-05', value: 44.3 },
        { month: '2024-06', value: 48.1 }
      ],
      predictions: [
        { period: '2024-07', forecast: 51.2, confidence_interval: [48.5, 53.9] },
        { period: '2024-08', forecast: 53.8, confidence_interval: [50.1, 57.5] },
        { period: '2024-09', forecast: 56.2, confidence_interval: [51.9, 60.5] }
      ]
    }
  };

  const logs = `
[00:00:01] Loading data...
[00:00:02] Processing 5000 records...
[00:00:03] Computing statistics...
[00:00:04] Running forecasting model...
[00:00:05] Analysis complete.
  `;

  const executionTime = Date.now() - startTime;

  return { output, logs, executionTime };
};

// Create new Python script
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { name, description, code } = req.body;

    if (!name || !code) {
      const error: AppError = new Error('Name and code are required');
      error.statusCode = 400;
      throw error;
    }

    const validation = validatePythonCode(code);
    if (!validation.valid) {
      const error: AppError = new Error(validation.error || 'Invalid Python code');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Creating Python script "${name}" for user ${userId}`);

    const scriptId = Math.floor(Math.random() * 10000);

    res.status(201).json({
      message: 'Script created successfully',
      script: {
        id: scriptId,
        name,
        description,
        code,
        status: 'draft',
        created_at: new Date().toISOString(),
        created_by: userId
      }
    });
  } catch (error) {
    logger.error('Failed to create Python script', { error });
    next(error);
  }
});

// List Python scripts
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { limit = 20, offset = 0, status } = req.query;

    logger.info(`Fetching Python scripts for user ${userId}`);

    // Mock scripts
    const mockScripts: PythonScript[] = [
      {
        id: 1,
        name: 'Customer Segmentation Analysis',
        description: 'K-means clustering for customer segments',
        code: `
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans

# Load customer data
data = customer_data
features = ['revenue', 'frequency', 'recency']
X = data[features]

# Fit clustering model
kmeans = KMeans(n_clusters=3, random_state=42)
clusters = kmeans.fit_predict(X)

# Analyze results
segment_analysis = {
  'high_value': sum(clusters == 0),
  'medium_value': sum(clusters == 1),
  'low_value': sum(clusters == 2)
}
`,
        created_at: '2024-08-15',
        updated_at: '2024-08-20',
        created_by: userId,
        status: 'published',
        execution_time: 2340,
        last_run: '2024-08-20 14:30:45'
      },
      {
        id: 2,
        name: 'Forecasting Model - Time Series',
        description: 'ARIMA model for revenue forecasting',
        code: `
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

# Load historical data
data = revenue_data
ts = data['revenue']

# Fit ARIMA model
model = ARIMA(ts, order=(1,1,1))
fitted_model = model.fit()

# Generate forecasts
forecast = fitted_model.get_forecast(steps=12)
forecasts = forecast.conf_int()
`,
        created_at: '2024-08-10',
        updated_at: '2024-08-18',
        created_by: userId,
        status: 'published',
        execution_time: 3120,
        last_run: '2024-08-18 10:15:30'
      },
      {
        id: 3,
        name: 'Anomaly Detection',
        description: 'Detect unusual patterns in marketing data',
        code: `
import pandas as pd
from sklearn.ensemble import IsolationForest

# Load data
data = marketing_data

# Fit anomaly detector
iso_forest = IsolationForest(contamination=0.1, random_state=42)
anomalies = iso_forest.fit_predict(data)

# Get anomaly scores
anomaly_scores = iso_forest.score_samples(data)
`,
        created_at: '2024-08-08',
        updated_at: '2024-08-19',
        created_by: userId,
        status: 'published'
      }
    ];

    let filtered = mockScripts;

    if (status && (status === 'draft' || status === 'published' || status === 'archived')) {
      filtered = filtered.filter(s => s.status === status);
    }

    res.json({
      data: filtered.slice(Number(offset), Number(offset) + Number(limit)),
      total: filtered.length,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch Python scripts', { error });
    next(error);
  }
});

// Get single script
router.get('/:scriptId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { scriptId } = req.params;

    logger.info(`Fetching Python script ${scriptId} for user ${userId}`);

    const script: PythonScript = {
      id: parseInt(scriptId),
      name: 'Customer Segmentation Analysis',
      description: 'K-means clustering for customer segments',
      code: `import pandas as pd
import numpy as np
from sklearn.cluster import KMeans`,
      created_at: '2024-08-15',
      updated_at: '2024-08-20',
      created_by: userId,
      status: 'published'
    };

    res.json({ script });
  } catch (error) {
    logger.error('Failed to fetch Python script', { error });
    next(error);
  }
});

// Update script
router.put('/:scriptId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { scriptId } = req.params;
    const { name, description, code, status } = req.body;

    if (code) {
      const validation = validatePythonCode(code);
      if (!validation.valid) {
        const error: AppError = new Error(validation.error || 'Invalid Python code');
        error.statusCode = 400;
        throw error;
      }
    }

    logger.info(`Updating Python script ${scriptId} for user ${userId}`);

    res.json({
      message: 'Script updated',
      script: {
        id: parseInt(scriptId),
        name,
        description,
        code,
        status,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to update Python script', { error });
    next(error);
  }
});

// Execute Python script
router.post('/:scriptId/execute', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { scriptId } = req.params;
    const { dataSource } = req.body;

    logger.info(`Executing Python script ${scriptId} for user ${userId}`);

    // Mock script data
    const scriptCode = `
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

# Load and preprocess data
data = load_data()
scaler = StandardScaler()
normalized = scaler.fit_transform(data)

# Generate analytics
results = {
  'data_quality': 0.95,
  'insights': ['Revenue trending up', 'Customer churn increasing']
}
`;

    const { output, logs, executionTime } = await executePythonScript(scriptCode, { dataSource });

    const resultId = Math.floor(Math.random() * 10000);

    res.json({
      message: 'Script executed successfully',
      result: {
        id: resultId,
        script_id: parseInt(scriptId),
        status: 'completed',
        result: output,
        logs,
        created_at: new Date().toISOString(),
        execution_time: executionTime
      }
    });
  } catch (error) {
    logger.error('Failed to execute Python script', { error });
    next(error);
  }
});

// Get execution results
router.get('/:scriptId/results', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { scriptId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    logger.info(`Fetching results for script ${scriptId}`);

    // Mock results
    const mockResults: AnalyticsResult[] = [
      {
        id: 1,
        script_id: parseInt(scriptId),
        status: 'completed',
        result: {
          clusters: {
            cluster_0: { size: 125, avg_value: 4200 },
            cluster_1: { size: 340, avg_value: 1800 },
            cluster_2: { size: 535, avg_value: 450 }
          }
        },
        output: 'Clustering complete with 3 segments',
        created_at: '2024-08-20 14:30:45',
        execution_time: 2340
      },
      {
        id: 2,
        script_id: parseInt(scriptId),
        status: 'completed',
        result: {
          silhouette_score: 0.68,
          davies_bouldin_index: 0.95
        },
        output: 'Quality metrics computed',
        created_at: '2024-08-19 10:15:30',
        execution_time: 1240
      }
    ];

    res.json({
      data: mockResults.slice(Number(offset), Number(offset) + Number(limit)),
      total: mockResults.length,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch execution results', { error });
    next(error);
  }
});

// Delete script
router.delete('/:scriptId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { scriptId } = req.params;

    logger.info(`Deleting Python script ${scriptId} for user ${userId}`);

    res.json({
      message: 'Script deleted',
      scriptId
    });
  } catch (error) {
    logger.error('Failed to delete Python script', { error });
    next(error);
  }
});

// Schedule script execution
router.post('/:scriptId/schedule', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { scriptId } = req.params;
    const { frequency, dataSource, exportTo } = req.body;

    logger.info(`Scheduling Python script ${scriptId} for user ${userId}`);

    res.json({
      message: 'Script scheduled successfully',
      schedule: {
        script_id: parseInt(scriptId),
        frequency,
        dataSource,
        exportTo,
        next_run: new Date(Date.now() + 3600000).toISOString(),
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to schedule script', { error });
    next(error);
  }
});

// Export to Tableau
router.post('/:scriptId/export-tableau', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { scriptId } = req.params;
    const { datasourceName, schedule } = req.body;

    logger.info(`Exporting script ${scriptId} results to Tableau for user ${userId}`);

    res.json({
      message: 'Export to Tableau configured',
      export: {
        script_id: parseInt(scriptId),
        datasource_name: datasourceName,
        status: 'active',
        last_sync: new Date().toISOString(),
        schedule,
        tableau_url: 'https://tableau.company.com/datasources/marketing-analytics'
      }
    });
  } catch (error) {
    logger.error('Failed to export to Tableau', { error });
    next(error);
  }
});

export default router;
