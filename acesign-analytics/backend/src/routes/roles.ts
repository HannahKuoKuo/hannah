import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import db from '../utils/db';

const router = Router();

interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: string;
  joined_at: string;
  permissions: string[];
}

const rolePermissions: Record<string, string[]> = {
  admin: [
    'view_dashboard',
    'manage_users',
    'manage_integrations',
    'view_analytics',
    'create_content',
    'publish_content',
    'manage_reports',
    'manage_settings'
  ],
  editor: [
    'view_dashboard',
    'view_analytics',
    'create_content',
    'publish_content',
    'manage_reports'
  ],
  viewer: [
    'view_dashboard',
    'view_analytics'
  ]
};

// Get all team members
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await db('users')
      .select('id', 'email', 'name', 'role as role', 'created_at')
      .orderBy('created_at', 'asc');

    const teamMembers = members.map(member => ({
      ...member,
      joined_at: member.created_at,
      permissions: rolePermissions[member.role] || []
    }));

    res.json({ data: teamMembers });
  } catch (error) {
    next(error);
  }
});

// Get user permissions
router.get('/permissions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await db('users')
      .where('id', req.userId!)
      .first();

    if (!user) {
      const error: AppError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const role = user.role || 'viewer';
    const permissions = rolePermissions[role] || [];

    res.json({
      role,
      permissions
    });
  } catch (error) {
    next(error);
  }
});

// Update team member role
router.put('/:memberId/role', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
      const error: AppError = new Error('Invalid role');
      error.statusCode = 400;
      error.code = 'INVALID_ROLE';
      throw error;
    }

    // Check if requester is admin
    const requester = await db('users')
      .where('id', req.userId!)
      .first();

    if (requester.role !== 'admin') {
      const error: AppError = new Error('Only admins can change roles');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const updated = await db('users')
      .where('id', memberId)
      .update({ role })
      .returning('*');

    const member = updated[0];
    res.json({
      data: {
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        permissions: rolePermissions[member.role] || [],
        joined_at: member.created_at
      }
    });

    logger.info(`Role updated for user ${memberId} to ${role}`);
  } catch (error) {
    next(error);
  }
});

// Remove team member
router.delete('/:memberId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;

    // Check if requester is admin
    const requester = await db('users')
      .where('id', req.userId!)
      .first();

    if (requester.role !== 'admin') {
      const error: AppError = new Error('Only admins can remove team members');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // Prevent self-removal
    if (parseInt(memberId) === req.userId!) {
      const error: AppError = new Error('Cannot remove yourself from the team');
      error.statusCode = 400;
      error.code = 'CANNOT_REMOVE_SELF';
      throw error;
    }

    await db('users')
      .where('id', memberId)
      .delete();

    res.json({ message: 'Team member removed' });
    logger.info(`Team member ${memberId} removed`);
  } catch (error) {
    next(error);
  }
});

// Resend invite
router.post('/:memberId/resend-invite', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;

    // Check if requester is admin
    const requester = await db('users')
      .where('id', req.userId!)
      .first();

    if (requester.role !== 'admin') {
      const error: AppError = new Error('Only admins can resend invites');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const member = await db('users')
      .where('id', memberId)
      .first();

    if (!member) {
      const error: AppError = new Error('Team member not found');
      error.statusCode = 404;
      throw error;
    }

    // In a real app, you would send an email here
    res.json({
      message: 'Invite resent successfully',
      email: member.email
    });

    logger.info(`Invite resent to ${member.email}`);
  } catch (error) {
    next(error);
  }
});

// Get role permissions
router.get('/:role/permissions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;

    if (!rolePermissions[role]) {
      const error: AppError = new Error('Invalid role');
      error.statusCode = 400;
      throw error;
    }

    res.json({
      role,
      permissions: rolePermissions[role]
    });
  } catch (error) {
    next(error);
  }
});

export default router;
