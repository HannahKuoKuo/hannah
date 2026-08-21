import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import db from '../utils/db';

const router = Router();

interface TestVariant {
  id: string;
  name: string;
  traffic_allocation: number;
  conversions: number;
  visits: number;
  conversion_rate: number;
}

interface ABTest {
  id: number;
  name: string;
  description: string;
  hypothesis: string;
  test_type: string;
  status: 'running' | 'completed' | 'paused';
  start_date: string;
  end_date?: string;
  variants: TestVariant[];
  sample_size: number;
  confidence_level: number;
}

// Chi-square test for statistical significance with precondition validation
const calculateChiSquare = (control: TestVariant, variant: TestVariant) => {
  const controlConversions = control.conversions;
  const controlNonConversions = control.visits - control.conversions;
  const variantConversions = variant.conversions;
  const variantNonConversions = variant.visits - variant.conversions;

  const total = control.visits + variant.visits;
  const expectedControl = (control.visits / total) * (controlConversions + variantConversions);
  const expectedControlNon = (control.visits / total) * (controlNonConversions + variantNonConversions);
  const expectedVariant = (variant.visits / total) * (controlConversions + variantConversions);
  const expectedVariantNon = (variant.visits / total) * (controlNonConversions + variantNonConversions);

  // Validate chi-square preconditions
  const minExpected = 5;
  const expectedFrequencies = [expectedControl, expectedControlNon, expectedVariant, expectedVariantNon];
  const violationsCount = expectedFrequencies.filter(e => e < minExpected).length;
  const preconditionsMet = violationsCount === 0;
  const warnings: string[] = [];

  if (!preconditionsMet) {
    warnings.push(`${violationsCount} cell(s) have expected frequency < ${minExpected}. Results may be unreliable.`);
  }

  // Check minimum sample size per variant (typically 100 minimum)
  if (control.visits < 100 || variant.visits < 100) {
    warnings.push('Sample size below recommended 100 per variant. Increase samples for reliable results.');
  }

  // Check minimum conversion counts (need at least 10 conversions per group)
  if (controlConversions < 10 || variantConversions < 10) {
    warnings.push('Insufficient conversions (<10) in one or more variants. Continue collecting data.');
  }

  const chiSquare =
    Math.pow(controlConversions - expectedControl, 2) / expectedControl +
    Math.pow(controlNonConversions - expectedControlNon, 2) / expectedControlNon +
    Math.pow(variantConversions - expectedVariant, 2) / expectedVariant +
    Math.pow(variantNonConversions - expectedVariantNon, 2) / expectedVariantNon;

  // Critical value for 95% confidence (chi-square with 1 df ≈ 3.841)
  return {
    chiSquare,
    isSignificant: chiSquare > 3.841 && preconditionsMet,
    pValue: getChiSquareP(chiSquare),
    preconditionsMet,
    expectedFrequencies: {
      controlConversions: expectedControl.toFixed(2),
      controlNonConversions: expectedControlNon.toFixed(2),
      variantConversions: expectedVariant.toFixed(2),
      variantNonConversions: expectedVariantNon.toFixed(2)
    },
    warnings,
    reliability: preconditionsMet ? 'high' : 'low'
  };
};

// Approximate p-value from chi-square
const getChiSquareP = (chiSquare: number): number => {
  if (chiSquare > 7.879) return 0.005;
  if (chiSquare > 6.635) return 0.01;
  if (chiSquare > 5.412) return 0.02;
  if (chiSquare > 3.841) return 0.05;
  if (chiSquare > 2.706) return 0.1;
  return 0.2;
};

// Get all A/B tests
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { status, type } = req.query;

    logger.info(`Fetching A/B tests for user ${userId}`);

    // Mock data
    const mockTests: ABTest[] = [
      {
        id: 1,
        name: 'Email Subject Line Test',
        description: 'Testing emoji vs no emoji in subject lines',
        hypothesis: 'Adding emojis to subject lines will increase open rates',
        test_type: 'email',
        status: 'completed',
        start_date: '2024-08-01',
        end_date: '2024-08-15',
        variants: [
          {
            id: 'control',
            name: 'Control (No Emoji)',
            traffic_allocation: 50,
            visits: 5000,
            conversions: 450,
            conversion_rate: 9.0
          },
          {
            id: 'variant_a',
            name: 'Variant A (With Emoji)',
            traffic_allocation: 50,
            visits: 5100,
            conversions: 540,
            conversion_rate: 10.59
          }
        ],
        sample_size: 10100,
        confidence_level: 95
      },
      {
        id: 2,
        name: 'Landing Page CTA Button Color',
        description: 'Red vs Green CTA button test',
        hypothesis: 'Green CTA buttons will have higher conversion rates',
        test_type: 'website',
        status: 'running',
        start_date: '2024-08-10',
        variants: [
          {
            id: 'control',
            name: 'Control (Red Button)',
            traffic_allocation: 50,
            visits: 3200,
            conversions: 320,
            conversion_rate: 10.0
          },
          {
            id: 'variant_a',
            name: 'Variant A (Green Button)',
            traffic_allocation: 50,
            visits: 3150,
            conversions: 380,
            conversion_rate: 12.06
          }
        ],
        sample_size: 6350,
        confidence_level: 95
      },
      {
        id: 3,
        name: 'Ad Copy Variation Test',
        description: 'Testing benefit-focused vs feature-focused copy',
        hypothesis: 'Benefit-focused messaging will generate more clicks',
        test_type: 'ad',
        status: 'running',
        start_date: '2024-08-15',
        variants: [
          {
            id: 'control',
            name: 'Feature-Focused',
            traffic_allocation: 50,
            visits: 2800,
            conversions: 280,
            conversion_rate: 10.0
          },
          {
            id: 'variant_a',
            name: 'Benefit-Focused',
            traffic_allocation: 50,
            visits: 2900,
            conversions: 350,
            conversion_rate: 12.07
          }
        ],
        sample_size: 5700,
        confidence_level: 95
      }
    ];

    let filtered = mockTests;

    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }

    if (type) {
      filtered = filtered.filter(t => t.test_type === type);
    }

    res.json({
      data: filtered
    });
  } catch (error) {
    logger.error('Failed to fetch A/B tests', { error });
    next(error);
  }
});

// Get single A/B test with statistical analysis
router.get('/:testId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { testId } = req.params;

    logger.info(`Fetching A/B test ${testId} for user ${userId}`);

    // Mock test data
    const mockTest: ABTest = {
      id: parseInt(testId),
      name: 'Email Subject Line Test',
      description: 'Testing emoji vs no emoji in subject lines',
      hypothesis: 'Adding emojis to subject lines will increase open rates',
      test_type: 'email',
      status: 'completed',
      start_date: '2024-08-01',
      end_date: '2024-08-15',
      variants: [
        {
          id: 'control',
          name: 'Control (No Emoji)',
          traffic_allocation: 50,
          visits: 5000,
          conversions: 450,
          conversion_rate: 9.0
        },
        {
          id: 'variant_a',
          name: 'Variant A (With Emoji)',
          traffic_allocation: 50,
          visits: 5100,
          conversions: 540,
          conversion_rate: 10.59
        }
      ],
      sample_size: 10100,
      confidence_level: 95
    };

    // Calculate statistical significance
    const control = mockTest.variants[0];
    const variant = mockTest.variants[1];
    const stats = calculateChiSquare(control, variant);

    // Calculate lift
    const lift = ((variant.conversion_rate - control.conversion_rate) / control.conversion_rate) * 100;
    const uplift = variant.conversion_rate - control.conversion_rate;

    res.json({
      test: mockTest,
      statistics: {
        control: {
          conversionRate: control.conversion_rate,
          conversions: control.conversions,
          visits: control.visits
        },
        variant: {
          conversionRate: variant.conversion_rate,
          conversions: variant.conversions,
          visits: variant.visits
        },
        lift: lift.toFixed(2),
        uplift: uplift.toFixed(2),
        chiSquare: stats.chiSquare.toFixed(3),
        isSignificant: stats.isSignificant,
        pValue: stats.pValue.toFixed(4),
        confidenceLevel: 95,
        winner: stats.isSignificant ? (lift > 0 ? 'variant' : 'control') : 'undetermined',
        preconditions: {
          met: stats.preconditionsMet,
          expectedFrequencies: stats.expectedFrequencies,
          reliability: stats.reliability,
          warnings: stats.warnings
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch A/B test', { error });
    next(error);
  }
});

// Create new A/B test
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { name, description, hypothesis, test_type, variants } = req.body;

    if (!name || !test_type || !variants || variants.length < 2) {
      const error: AppError = new Error('Missing required fields');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Creating A/B test for user ${userId}`);

    // Mock: return created test
    const newTest = {
      id: Math.floor(Math.random() * 10000),
      name,
      description,
      hypothesis,
      test_type,
      status: 'running',
      start_date: new Date().toISOString(),
      variants: variants.map((v: any, idx: number) => ({
        id: `variant_${idx}`,
        name: v.name,
        traffic_allocation: v.traffic_allocation || 50,
        visits: 0,
        conversions: 0,
        conversion_rate: 0
      })),
      sample_size: 0,
      confidence_level: 95
    };

    res.status(201).json({
      message: 'A/B test created',
      test: newTest
    });
  } catch (error) {
    logger.error('Failed to create A/B test', { error });
    next(error);
  }
});

// Update A/B test status
router.put('/:testId/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { testId } = req.params;
    const { status } = req.body;

    if (!['running', 'completed', 'paused'].includes(status)) {
      const error: AppError = new Error('Invalid status');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`Updating test ${testId} status to ${status}`);

    res.json({
      message: 'Test status updated',
      testId,
      status
    });
  } catch (error) {
    logger.error('Failed to update test status', { error });
    next(error);
  }
});

// Record conversion for test variant
router.post('/:testId/convert', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { testId } = req.params;
    const { variantId, revenue } = req.body;

    logger.info(`Recording conversion for test ${testId}, variant ${variantId}`);

    res.json({
      message: 'Conversion recorded',
      testId,
      variantId
    });
  } catch (error) {
    logger.error('Failed to record conversion', { error });
    next(error);
  }
});

// Get statistical summary across all tests
router.get('/summary/overview', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    res.json({
      summary: {
        totalTests: 3,
        runningTests: 2,
        completedTests: 1,
        averageLift: 2.1,
        significantWinners: 1,
        totalParticipants: 22150,
        estimatedRevenueLift: 2850
      }
    });
  } catch (error) {
    logger.error('Failed to fetch summary', { error });
    next(error);
  }
});

export default router;
