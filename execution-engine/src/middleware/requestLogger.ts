import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';
import { createRequestLogger } from '../utils/logger';
import { CustomRequest } from '../types';

// Custom morgan token for request ID
morgan.token('requestId', (req: Request) => {
  return (req as CustomRequest).requestId || 'unknown';
});

// Custom morgan token for response time in milliseconds
morgan.token('responseTimeMs', (req: Request, res: Response) => {
  const customReq = req as CustomRequest;
  if (customReq.startTime) {
    return `${Date.now() - customReq.startTime}ms`;
  }
  return 'unknown';
});

// Custom morgan format
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :responseTimeMs - :requestId';

// Request ID middleware
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const customReq = req as CustomRequest;
  customReq.requestId = uuidv4();
  customReq.startTime = Date.now();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', customReq.requestId);
  
  next();
};

// Request logging middleware
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const customReq = req as CustomRequest;
  const requestLogger = createRequestLogger(customReq.requestId || 'unknown');

  // Log request start
  requestLogger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const responseTime = customReq.startTime ? Date.now() - customReq.startTime : 0;
    
    requestLogger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });

    return originalEnd(chunk, encoding, cb);
  };

  next();
};

// Morgan middleware for HTTP request logging
export const morganMiddleware = morgan(morganFormat, {
  skip: (req: Request) => {
    // Skip logging for health check endpoints
    return req.url === '/health' || req.url === '/health/ready';
  },
});

export default { requestIdMiddleware, requestLoggerMiddleware, morganMiddleware };
