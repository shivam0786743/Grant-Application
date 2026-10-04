import express from 'express';
import cors from 'cors';
import { assessmentRoutes } from './routes/assessment.routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/env';

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      // Allow localhost dev servers or configured frontend URL
      if (
        origin === config.frontendUrl ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for assessment testing
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
  })
);

// Body Parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Grant Application Completeness Assistant Backend',
    environment: config.nodeEnv,
    geminiLive: Boolean(config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here')
  });
});

// API Routes
app.use('/api/assessments', assessmentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested path ${req.method} ${req.path} does not exist.`
    }
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
