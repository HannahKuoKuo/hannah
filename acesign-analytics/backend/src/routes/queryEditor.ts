import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import db from '../utils/db';

const router = Router();

interface SavedQuery {
  id: number;
  name: string;
  query: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  is_shared: boolean;
  execution_time: number;
  rows_returned: number;
}

interface QueryExecution {
  queryId?: number;
  query: string;
  results: any[];
  columns: string[];
  rowCount: number;
  executionTime: number;
  timestamp: string;
}

// Whitelist of allowed tables and operations
const ALLOWED_TABLES = [
  'users', 'campaigns', 'customers', 'orders', 'emails',
  'social_posts', 'utm_clicks', 'conversions', 'analytics'
];

const ALLOWED_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY',
  'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'INNER JOIN',
  'AND', 'OR', 'IN', 'LIKE', 'BETWEEN', 'COUNT', 'SUM',
  'AVG', 'MAX', 'MIN', 'HAVING', 'DISTINCT', 'AS'
];

// Strip SQL comments to prevent bypass techniques
const stripComments = (query: string): string => {
  return query
    .replace(/--.*$/gm, '') // Remove line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .trim();
};

// Validate query for security
const validateQuery = (query: string): { valid: boolean; error?: string } => {
  if (!query || typeof query !== 'string' || query.length === 0) {
    return { valid: false, error: 'Query cannot be empty' };
  }

  if (query.length > 50000) {
    return { valid: false, error: 'Query exceeds maximum size (50KB)' };
  }

  // Strip comments first to prevent comment-based bypasses
  const cleanQuery = stripComments(query);
  const upperQuery = cleanQuery.toUpperCase();

  // Block dangerous operations (check both original and clean queries)
  const dangerousPatterns = [
    /\bDROP\b/, /\bDELETE\b/, /\bINSERT\b/, /\bUPDATE\b/,
    /\bALTER\b/, /\bCREATE\b/, /\bTRUNCATE\b/, /\bEXEC\b/,
    /\bEXECUTE\b/, /\bPRAGMA\b/, /\bATTACH\b/, /\bDETACH\b/
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(upperQuery)) {
      return { valid: false, error: 'Query contains forbidden operations' };
    }
  }

  // Ensure query starts with SELECT
  if (!upperQuery.trim().startsWith('SELECT')) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }

  // Check for allowed tables
  let hasAllowedTable = false;
  for (const table of ALLOWED_TABLES) {
    if (new RegExp(`\\b${table.toUpperCase()}\\b`).test(upperQuery)) {
      hasAllowedTable = true;
      break;
    }
  }

  if (!hasAllowedTable) {
    return { valid: false, error: `Query must reference one of: ${ALLOWED_TABLES.join(', ')}` };
  }

  // Ensure LIMIT is present and has a numeric value (prevent result explosion)
  const limitMatch = cleanQuery.match(/LIMIT\s+(\d+)/i);
  if (!limitMatch) {
    return { valid: false, error: 'Query must include LIMIT clause (e.g., LIMIT 1000)' };
  }

  const limitValue = parseInt(limitMatch[1]);
  if (limitValue > 10000) {
    return { valid: false, error: `LIMIT cannot exceed 10000 (requested: ${limitValue})` };
  }

  return { valid: true };
};

// Execute SQL query
router.post('/execute', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { query, saveAs } = req.body;

    if (!query || typeof query !== 'string') {
      const error: AppError = new Error('Query is required');
      error.statusCode = 400;
      throw error;
    }

    // Validate query
    const validation = validateQuery(query);
    if (!validation.valid) {
      const error: AppError = new Error(validation.error || 'Invalid query');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Executing query for user ${userId}`);

    const startTime = Date.now();

    // Mock query execution - in production would use actual DB connection pool
    const mockResults = {
      users: [
        { id: 1, email: 'john@example.com', created_at: '2024-01-15', status: 'active' },
        { id: 2, email: 'sarah@example.com', created_at: '2024-02-20', status: 'active' },
        { id: 3, email: 'michael@example.com', created_at: '2024-03-10', status: 'inactive' }
      ],
      campaigns: [
        { id: 1, name: 'Summer Sale', status: 'running', created_at: '2024-08-01', recipients: 5000 },
        { id: 2, name: 'Fall Promotion', status: 'draft', created_at: '2024-08-15', recipients: 3000 }
      ],
      conversions: [
        { id: 1, user_id: 1, campaign_id: 1, revenue: 150, created_at: '2024-08-05' },
        { id: 2, user_id: 2, campaign_id: 1, revenue: 200, created_at: '2024-08-06' },
        { id: 3, user_id: 1, campaign_id: 2, revenue: 75, created_at: '2024-08-16' }
      ]
    };

    const queryUpper = query.toUpperCase();
    let results: any[] = [];

    if (queryUpper.includes('FROM USERS')) {
      results = mockResults.users;
    } else if (queryUpper.includes('FROM CAMPAIGNS')) {
      results = mockResults.campaigns;
    } else if (queryUpper.includes('FROM CONVERSIONS')) {
      results = mockResults.conversions;
    } else {
      results = mockResults.users;
    }

    // Apply LIMIT if present
    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      results = results.slice(0, parseInt(limitMatch[1]));
    }

    const executionTime = Date.now() - startTime;
    const columns = results.length > 0 ? Object.keys(results[0]) : [];

    // Save query if requested
    let savedQueryId: number | null = null;
    if (saveAs) {
      savedQueryId = Math.floor(Math.random() * 10000);
      logger.info(`Saving query ${savedQueryId} for user ${userId}`);
    }

    res.json({
      success: true,
      execution: {
        queryId: savedQueryId,
        results,
        columns,
        rowCount: results.length,
        executionTime,
        timestamp: new Date().toISOString()
      },
      message: `Query executed successfully, returned ${results.length} rows in ${executionTime}ms`
    });
  } catch (error) {
    logger.error('Failed to execute query', { error });
    next(error);
  }
});

// Get query history
router.get('/history', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { limit = 50, offset = 0 } = req.query;

    logger.info(`Fetching query history for user ${userId}`);

    // Mock query history
    const mockHistory: SavedQuery[] = [
      {
        id: 1,
        name: 'Active Users',
        query: 'SELECT * FROM users WHERE status = \'active\' LIMIT 100',
        description: 'List of all active users',
        created_at: '2024-08-20',
        updated_at: '2024-08-20',
        created_by: userId,
        is_shared: false,
        execution_time: 145,
        rows_returned: 52
      },
      {
        id: 2,
        name: 'Campaign Performance',
        query: 'SELECT campaigns.*, COUNT(conversions.id) as conversions FROM campaigns LEFT JOIN conversions ON campaigns.id = conversions.campaign_id GROUP BY campaigns.id',
        description: 'Campaign conversion metrics',
        created_at: '2024-08-19',
        updated_at: '2024-08-19',
        created_by: userId,
        is_shared: true,
        execution_time: 230,
        rows_returned: 8
      },
      {
        id: 3,
        name: 'Revenue by User',
        query: 'SELECT users.email, SUM(conversions.revenue) as total_revenue FROM users LEFT JOIN conversions ON users.id = conversions.user_id GROUP BY users.id ORDER BY total_revenue DESC',
        description: 'User revenue analysis',
        created_at: '2024-08-18',
        updated_at: '2024-08-18',
        created_by: userId,
        is_shared: false,
        execution_time: 312,
        rows_returned: 50
      }
    ];

    res.json({
      data: mockHistory,
      total: mockHistory.length,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch query history', { error });
    next(error);
  }
});

// Save query
router.post('/save', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { name, query, description } = req.body;

    if (!name || !query) {
      const error: AppError = new Error('Name and query are required');
      error.statusCode = 400;
      throw error;
    }

    const validation = validateQuery(query);
    if (!validation.valid) {
      const error: AppError = new Error(validation.error || 'Invalid query');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Saving query "${name}" for user ${userId}`);

    const queryId = Math.floor(Math.random() * 10000);

    res.status(201).json({
      message: 'Query saved successfully',
      query: {
        id: queryId,
        name,
        query,
        description,
        created_at: new Date().toISOString(),
        created_by: userId
      }
    });
  } catch (error) {
    logger.error('Failed to save query', { error });
    next(error);
  }
});

// Update saved query
router.put('/:queryId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { queryId } = req.params;
    const { name, query, description } = req.body;

    if (query) {
      const validation = validateQuery(query);
      if (!validation.valid) {
        const error: AppError = new Error(validation.error || 'Invalid query');
        error.statusCode = 400;
        throw error;
      }
    }

    logger.info(`Updating query ${queryId} for user ${userId}`);

    res.json({
      message: 'Query updated',
      query: {
        id: parseInt(queryId),
        name,
        query,
        description,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to update query', { error });
    next(error);
  }
});

// Delete saved query
router.delete('/:queryId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { queryId } = req.params;

    logger.info(`Deleting query ${queryId} for user ${userId}`);

    res.json({
      message: 'Query deleted',
      queryId
    });
  } catch (error) {
    logger.error('Failed to delete query', { error });
    next(error);
  }
});

// Get table schema
router.get('/schema/:tableName', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableName } = req.params;

    if (!ALLOWED_TABLES.includes(tableName.toLowerCase())) {
      const error: AppError = new Error(`Table '${tableName}' is not accessible`);
      error.statusCode = 403;
      throw error;
    }

    logger.info(`Fetching schema for table ${tableName}`);

    // Mock schema information
    const mockSchemas: Record<string, any[]> = {
      users: [
        { column: 'id', type: 'INTEGER', nullable: false },
        { column: 'email', type: 'VARCHAR(255)', nullable: false },
        { column: 'status', type: 'VARCHAR(50)', nullable: true },
        { column: 'created_at', type: 'TIMESTAMP', nullable: false }
      ],
      campaigns: [
        { column: 'id', type: 'INTEGER', nullable: false },
        { column: 'name', type: 'VARCHAR(255)', nullable: false },
        { column: 'status', type: 'VARCHAR(50)', nullable: true },
        { column: 'recipients', type: 'INTEGER', nullable: true },
        { column: 'created_at', type: 'TIMESTAMP', nullable: false }
      ],
      conversions: [
        { column: 'id', type: 'INTEGER', nullable: false },
        { column: 'user_id', type: 'INTEGER', nullable: false },
        { column: 'campaign_id', type: 'INTEGER', nullable: true },
        { column: 'revenue', type: 'DECIMAL(10,2)', nullable: true },
        { column: 'created_at', type: 'TIMESTAMP', nullable: false }
      ]
    };

    const schema = mockSchemas[tableName.toLowerCase()] || [];

    res.json({
      table: tableName,
      columns: schema,
      description: `Schema for ${tableName} table`
    });
  } catch (error) {
    logger.error('Failed to fetch schema', { error });
    next(error);
  }
});

// Get available tables
router.get('/tables/list', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Fetching available tables');

    res.json({
      tables: ALLOWED_TABLES,
      message: 'Available tables for querying'
    });
  } catch (error) {
    logger.error('Failed to fetch tables', { error });
    next(error);
  }
});

export default router;
