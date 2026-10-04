import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory or root directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/grant_completeness_db',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '15728640', 10), // 15MB
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};
