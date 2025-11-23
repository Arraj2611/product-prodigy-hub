import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/index.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import oauthRoutes from './routes/oauth.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import bomRoutes from './routes/bom.routes.js';
import sourcingRoutes from './routes/sourcing.routes.js';
import productRoutes from './routes/product.routes.js';
import complianceRoutes from './routes/compliance.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import marketingRoutes from './routes/marketing.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Static file serving for local uploads
if (config.STORAGE_TYPE === 'local') {
  const uploadsPath = path.resolve(config.STORAGE_LOCAL_PATH || './uploads');
  app.use('/uploads', express.static(uploadsPath));
  logger.info(`📁 Serving local uploads from: ${uploadsPath}`);
}

// Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// API routes
app.get(`/api/${config.API_VERSION}`, (_req, res) => {
  res.json({
    success: true,
    message: 'SourceFlow API',
    version: config.API_VERSION,
  });
});

app.use(`/api/${config.API_VERSION}/auth`, authRoutes);
app.use(`/api/${config.API_VERSION}/auth/oauth`, oauthRoutes);
app.use(`/api/${config.API_VERSION}/upload`, uploadRoutes);
app.use(`/api/${config.API_VERSION}`, bomRoutes);
app.use(`/api/${config.API_VERSION}`, productRoutes);
app.use(`/api/${config.API_VERSION}/sourcing`, sourcingRoutes);
app.use(`/api/${config.API_VERSION}/compliance`, complianceRoutes);
app.use(`/api/${config.API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${config.API_VERSION}/marketing`, marketingRoutes);
app.use(`/api/${config.API_VERSION}`, notificationRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${config.NODE_ENV}`);
  logger.info(`🔗 API Version: ${config.API_VERSION}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;

