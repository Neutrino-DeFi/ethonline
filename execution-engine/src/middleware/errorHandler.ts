import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AppError } from '../utils/errors';
import { config } from '../config/environment';
import { CustomRequest } from '../types';

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    requestId?: string;
    timestamp: string;
    stack?: string;
  };
}

// Global error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const customReq = req as CustomRequest;
  const requestId = customReq.requestId;

  // Log the error
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    requestId,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      statusCode,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  // Include stack trace in development
  if (config.isDevelopment) {
    errorResponse.error.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);

  // Exit process for non-operational errors in production
  if (!isOperational && config.isProduction) {
    logger.error('Non-operational error detected, shutting down gracefully');
    process.exit(1);
  }
};

// 404 handler for undefined routes
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const customReq = req as CustomRequest;
  const requestId = customReq.requestId;

  logger.warn('Route not found', {
    requestId,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      statusCode: 404,
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
