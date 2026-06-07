import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { setupSwagger } from './swagger';
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';
import { apiRateLimit } from './shared/middleware/rateLimit.middleware';
import router from './routes';

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow extension requests
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl) or from allowed origins
      if (!origin) return callback(null, true);

      // Allow Chrome extensions
      if (origin.startsWith('chrome-extension://')) return callback(null, true);

      // Allow configured web origins
      if (env.CORS_ORIGINS.some((o) => origin.startsWith(o))) {
        return callback(null, true);
      }

      callback(new Error(`CORS: Origin "${origin}" not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── General middleware ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(apiRateLimit);

// ── Documentation ───────────────────────────────────────────────────────────
setupSwagger(app);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Website Locker API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', router);

// ── Error handling (must be last) ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
