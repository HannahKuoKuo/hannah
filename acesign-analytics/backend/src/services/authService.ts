import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../utils/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    company_name?: string;
    full_name?: string;
  }) {
    try {
      const db = getDatabase();

      const existing = await db('users').where({ email: data.email }).first();
      if (existing) {
        const error: AppError = new Error('Email already registered');
        error.statusCode = 409;
        error.code = 'EMAIL_EXISTS';
        throw error;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const [user] = await db('users').insert({
        email: data.email,
        password_hash: hashedPassword,
        company_name: data.company_name,
        full_name: data.full_name,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');

      logger.info(`User registered: ${data.email}`);

      const token = this.generateToken(user.id);
      return {
        user: {
          id: user.id,
          email: user.email,
          company_name: user.company_name,
          full_name: user.full_name
        },
        token,
        expiresIn: '24h'
      };
    } catch (error) {
      logger.error('Registration failed', { error });
      throw error;
    }
  }

  static async login(email: string, password: string) {
    try {
      const db = getDatabase();

      const user = await db('users').where({ email }).first();
      if (!user) {
        const error: AppError = new Error('Invalid credentials');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        const error: AppError = new Error('Invalid credentials');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
      }

      if (!user.is_active) {
        const error: AppError = new Error('Account is inactive');
        error.statusCode = 403;
        error.code = 'ACCOUNT_INACTIVE';
        throw error;
      }

      logger.info(`User logged in: ${email}`);

      const token = this.generateToken(user.id);
      return {
        user: {
          id: user.id,
          email: user.email,
          company_name: user.company_name,
          full_name: user.full_name
        },
        token,
        expiresIn: '24h'
      };
    } catch (error) {
      logger.error('Login failed', { error });
      throw error;
    }
  }

  static async getProfile(userId: number) {
    try {
      const db = getDatabase();
      const user = await db('users').where({ id: userId }).first();

      if (!user) {
        const error: AppError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      return {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        full_name: user.full_name,
        created_at: user.created_at
      };
    } catch (error) {
      logger.error('Failed to get profile', { error });
      throw error;
    }
  }

  static async updateProfile(userId: number, data: any) {
    try {
      const db = getDatabase();

      const updated = await db('users')
        .where({ id: userId })
        .update({
          ...data,
          updated_at: new Date()
        })
        .returning('*');

      if (!updated.length) {
        const error: AppError = new Error('User not found');
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
      }

      const user = updated[0];
      logger.info(`User profile updated: ${userId}`);

      return {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        full_name: user.full_name
      };
    } catch (error) {
      logger.error('Failed to update profile', { error });
      throw error;
    }
  }

  private static generateToken(userId: number): string {
    const token = jwt.sign(
      { userId, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    return token;
  }
}

export default new AuthService();
