import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../utils/database';
import { logger } from '../utils/logger';
import reportGenerator from '../services/reportGenerator';
import { AppError } from '../middleware/errorHandler';
import { format } from 'date-fns';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;

    let query = db('reports').where({ user_id: userId });

    if (type) {
      query = query.where({ report_type: type });
    }

    const [reports, total] = await Promise.all([
      query
        .orderBy('generated_at', 'desc')
        .limit(limit)
        .offset(offset),

      query.count('* as count').first()
    ]);

    res.json({
      data: reports,
      total: (total as any)?.count || 0,
      limit,
      offset
    });
  } catch (error) {
    logger.error('Failed to fetch reports', { error });
    next(error);
  }
});

router.get('/:reportId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { reportId } = req.params;
    const db = getDatabase();

    const report = await db('reports')
      .where({ id: reportId, user_id: userId })
      .first();

    if (!report) {
      const error: AppError = new Error('Report not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const data = typeof report.data === 'string' ? JSON.parse(report.data) : report.data;

    res.json({
      ...report,
      data
    });
  } catch (error) {
    logger.error('Failed to fetch report', { error });
    next(error);
  }
});

router.post('/generate/monthly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { date } = req.body;

    logger.info(`Generating monthly report for user ${userId}`);

    const result = await reportGenerator.generateMonthlyReport(
      userId,
      date ? new Date(date) : new Date()
    );

    res.status(201).json({
      message: 'Monthly report generated',
      reportId: result.report.id,
      report: result.report,
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to generate monthly report', { error });
    next(error);
  }
});

router.post('/generate/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { date } = req.body;

    logger.info(`Generating weekly report for user ${userId}`);

    const result = await reportGenerator.generateWeeklyReport(
      userId,
      date ? new Date(date) : new Date()
    );

    res.status(201).json({
      message: 'Weekly report generated',
      reportId: result.report.id,
      report: result.report,
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to generate weekly report', { error });
    next(error);
  }
});

router.post('/generate/:reportId/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { reportId } = req.params;

    logger.info(`Generating PDF for report ${reportId}`);

    const filePath = await reportGenerator.generatePDFReport(userId, parseInt(reportId));

    res.json({
      message: 'PDF report generated',
      reportId,
      filePath
    });
  } catch (error) {
    logger.error('Failed to generate PDF report', { error });
    next(error);
  }
});

router.get('/:reportId/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { reportId } = req.params;
    const db = getDatabase();

    const report = await db('reports')
      .where({ id: reportId, user_id: userId })
      .first();

    if (!report) {
      const error: AppError = new Error('Report not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (!report.file_path) {
      const error: AppError = new Error('PDF not available for this report');
      error.statusCode = 400;
      error.code = 'NO_PDF_AVAILABLE';
      throw error;
    }

    res.download(report.file_path, `report-${reportId}.pdf`);
  } catch (error) {
    logger.error('Failed to download report', { error });
    next(error);
  }
});

router.delete('/:reportId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { reportId } = req.params;
    const db = getDatabase();

    const report = await db('reports')
      .where({ id: reportId, user_id: userId })
      .first();

    if (!report) {
      const error: AppError = new Error('Report not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await db('reports').where({ id: reportId }).del();

    logger.info(`Report deleted: ${reportId}`);

    res.json({
      message: 'Report deleted',
      reportId
    });
  } catch (error) {
    logger.error('Failed to delete report', { error });
    next(error);
  }
});

// Advanced custom report generation
router.post('/generate/custom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const {
      title,
      description,
      sources,
      dateRange,
      metrics,
      filters,
      templateName
    } = req.body;

    logger.info(`Generating custom report for user ${userId}`, { sources });

    const db = getDatabase();

    const reportData = {
      user_id: userId,
      title: title || 'Custom Report',
      description: description || '',
      report_type: 'custom',
      data: JSON.stringify({
        sources,
        dateRange,
        metrics,
        filters,
        generateTime: new Date().toISOString()
      }),
      generated_at: new Date(),
      file_path: null
    };

    const result = await db('reports').insert(reportData).returning('*');
    const report = result[0];

    // Save as template if requested
    if (templateName) {
      await db('report_templates').insert({
        user_id: userId,
        template_name: templateName,
        config: JSON.stringify({
          sources,
          dateRange,
          metrics,
          filters
        }),
        created_at: new Date()
      });
    }

    res.status(201).json({
      message: 'Custom report generated',
      reportId: report.id,
      report
    });
  } catch (error) {
    logger.error('Failed to generate custom report', { error });
    next(error);
  }
});

// Get saved report templates
router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const templates = await db('report_templates')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    res.json({
      data: templates || []
    });
  } catch (error) {
    logger.error('Failed to fetch templates', { error });
    next(error);
  }
});

// Save current report as template
router.post('/:reportId/save-as-template', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { reportId } = req.params;
    const { templateName } = req.body;

    if (!templateName) {
      const error: AppError = new Error('Template name is required');
      error.statusCode = 400;
      throw error;
    }

    const db = getDatabase();
    const report = await db('reports')
      .where({ id: reportId, user_id: userId })
      .first();

    if (!report) {
      const error: AppError = new Error('Report not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const template = await db('report_templates').insert({
      user_id: userId,
      template_name: templateName,
      config: report.data,
      created_at: new Date()
    }).returning('*');

    res.status(201).json({
      message: 'Template saved',
      template: template[0]
    });
  } catch (error) {
    logger.error('Failed to save template', { error });
    next(error);
  }
});

// Load template
router.get('/templates/:templateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { templateId } = req.params;
    const db = getDatabase();

    const template = await db('report_templates')
      .where({ id: templateId, user_id: userId })
      .first();

    if (!template) {
      const error: AppError = new Error('Template not found');
      error.statusCode = 404;
      throw error;
    }

    const config = typeof template.config === 'string' ? JSON.parse(template.config) : template.config;

    res.json({
      data: {
        ...template,
        config
      }
    });
  } catch (error) {
    logger.error('Failed to fetch template', { error });
    next(error);
  }
});

// Delete template
router.delete('/templates/:templateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { templateId } = req.params;
    const db = getDatabase();

    const template = await db('report_templates')
      .where({ id: templateId, user_id: userId })
      .first();

    if (!template) {
      const error: AppError = new Error('Template not found');
      error.statusCode = 404;
      throw error;
    }

    await db('report_templates').where({ id: templateId }).del();

    res.json({
      message: 'Template deleted',
      templateId
    });
  } catch (error) {
    logger.error('Failed to delete template', { error });
    next(error);
  }
});

export default router;
