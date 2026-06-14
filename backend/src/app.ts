import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables BEFORE importing config
dotenv.config();

import { config } from './config/environment';
import { corsMiddleware, rateLimitMiddleware } from './middleware';
import routes from './routes';
import { errorHandler } from './utils';
import logger from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(corsMiddleware);

// Rate limiting
app.use(rateLimitMiddleware);

// Logging middleware
app.use((req, res, next) => {
  logger.info('request', { method: req.method, path: req.path });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  logger.info('server_start', {
    port: PORT,
    env: config.NODE_ENV,
    corsOrigin: config.CORS_ORIGIN,
  });
});

export default app;
