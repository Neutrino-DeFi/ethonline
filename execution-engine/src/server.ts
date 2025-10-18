import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestIdMiddleware, requestLoggerMiddleware, morganMiddleware } from './middleware/requestLogger';
import routes from './routes';

class Server {
  private app: Application;
  private port: number;
  private host: string;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.host = config.host;
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin === '*' ? true : config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Compression middleware
    this.app.use(compression() as any);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        error: {
          message: 'Too many requests from this IP, please try again later.',
          statusCode: 429,
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Request ID and logging middleware
    this.app.use(requestIdMiddleware);
    this.app.use(requestLoggerMiddleware);
    this.app.use(morganMiddleware);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy (for accurate IP addresses behind reverse proxy)
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Execution Engine Server',
        version: config.app.version,
        environment: config.env,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
      });
    });

    // Mount API routes
    this.app.use(routes);
  }

  private initializeErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public start(): void {
    // Graceful shutdown handlers
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));

    // Start server
    this.app.listen(this.port, this.host, () => {
      logger.info('Server started successfully', {
        port: this.port,
        host: this.host,
        environment: config.env,
        version: config.app.version,
        pid: process.pid,
      });
    });
  }

  private gracefulShutdown(signal: string): void {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    
    // Give ongoing requests time to complete
    setTimeout(() => {
      logger.info('Graceful shutdown completed');
      process.exit(0);
    }, 10000); // 10 seconds timeout
  }

  private handleUncaughtException(error: Error): void {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });
    
    // Exit process for uncaught exceptions
    process.exit(1);
  }

  private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      promise: promise.toString(),
    });
    
    // Exit process for unhandled rejections in production
    if (config.isProduction) {
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();
server.start();

export default server;
