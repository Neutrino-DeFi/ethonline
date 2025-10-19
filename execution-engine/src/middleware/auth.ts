import { Request, Response, NextFunction } from 'express';
import { PrivyClient } from '@privy-io/server-auth';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { CustomRequest } from '../types';
import logger from '../utils/logger';

// Initialize Privy client
const privy = new PrivyClient(
  process.env["NEXT_PUBLIC_PRIVY_APP_ID"] || "",
  process.env["NEXT_PUBLIC_PRIVY_APP_SECRET"] || ""
);

// Extend CustomRequest to include user data
export interface AuthenticatedRequest extends CustomRequest {
  user?: {
    id: string;
    walletAddress: string;
    uniqueWalletId: string;
  };
}

// Authentication middleware
export const auth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the Privy token
    const verifiedUser: any = await privy.verifyAuthToken(token);
    
    if (!verifiedUser) {
      throw new UnauthorizedError('Invalid token');
    }

    // Extract user information from verified token
    const user = {
      id: (verifiedUser && (verifiedUser.id || verifiedUser.userId || verifiedUser.sub)) || '',
      walletAddress: (verifiedUser && (verifiedUser.wallet?.address || verifiedUser.address)) || '',
      uniqueWalletId: (verifiedUser && (verifiedUser.id || verifiedUser.userId || verifiedUser.sub)) || '',
    };

    // Attach user to request
    req.user = user;
    
    logger.info('User authenticated successfully', {
      userId: user.id,
      walletAddress: user.walletAddress,
      requestId: req.requestId,
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
    });
    
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

// Admin authorization middleware
export const isAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated');
    }

    // For now, we'll use a simple environment variable check
    // In production, you might want to check against a database or use role-based access
    const adminWalletAddresses = (process.env['ADMIN_WALLET_ADDRESSES'] || '').split(',').filter(Boolean);
    
    if (!adminWalletAddresses.includes(req.user.walletAddress)) {
      throw new ForbiddenError('Admin access required');
    }

    logger.info('Admin access granted', {
      userId: req.user.id,
      walletAddress: req.user.walletAddress,
      requestId: req.requestId,
    });

    next();
  } catch (error) {
    logger.error('Admin authorization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      requestId: req.requestId,
    });
    
    next(error);
  }
};
