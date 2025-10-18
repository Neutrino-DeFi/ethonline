import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/environment';
import { LogEntry } from '../types';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (config.isDevelopment) {
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: consoleFormat,
    })
  );
}

// File transports for production
if (config.isProduction) {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
    })
  );

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: config.logging.fileMaxSize,
      maxFiles: config.logging.fileMaxFiles,
    })
  );

  // Console transport for production (with JSON format)
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Add request ID to log entries
export const createRequestLogger = (requestId: string) => {
  return {
    error: (message: string, meta?: Record<string, unknown>) => {
      logger.error(message, { requestId, ...meta });
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      logger.warn(message, { requestId, ...meta });
    },
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(message, { requestId, ...meta });
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      logger.debug(message, { requestId, ...meta });
    },
  };
};

// Log application startup
logger.info('Logger initialized', {
  environment: config.env,
  logLevel: config.logging.level,
});

export default logger;
