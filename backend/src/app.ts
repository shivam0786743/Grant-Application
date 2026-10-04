import express from 'express';
import cors from 'cors';
import { assessmentRoutes } from './routes/assessment.routes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/env';

const app = express();

// CORS — strictly whitelist FRONTEND_URL (set in env) + localhost for development
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) or health checks
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin "${origin}" is not allowed`));
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
