import { Request, Response, NextFunction } from 'express';

// Custom request interface with additional properties
export interface CustomRequest extends Request {
  requestId?: string;
  startTime?: number;
}

// Custom response interface
export interface CustomResponse extends Response {
  // Add any custom response properties here
}

// Error types
export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Health check response type
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  memory: {
    used: string;
    total: string;
    percentage: number;
  };
  cpu?: {
    usage: number;
  };
}

// Log entry type
export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Middleware type
export type Middleware = (
  req: CustomRequest,
  res: CustomResponse,
  next: NextFunction
) => void | Promise<void>;

// Route handler type
export type RouteHandler = (
  req: CustomRequest,
  res: CustomResponse,
  next: NextFunction
) => void | Promise<void>;

// Async route handler type
export type AsyncRouteHandler = (
  req: CustomRequest,
  res: CustomResponse,
  next: NextFunction
) => Promise<void>;
