import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

let memoryServer: any = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', false);
    
    // In test environment, optionally use in-memory server
    if (config.isTest && !process.env.MONGODB_URI) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      logger.info(`Connecting to test in-memory MongoDB at ${uri}`);
      return await mongoose.connect(uri);
    }

    try {
      logger.info(`Connecting to MongoDB at ${config.mongoUri}...`);
      const conn = await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      logger.info(`Connected to MongoDB successfully (${conn.connection.name})`);
      return conn;
    } catch (err: any) {
      if (config.nodeEnv === 'development') {
        logger.warn(`Could not connect to external MongoDB: ${err.message}. Falling back to in-memory MongoDB for local development...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const fallbackUri = memoryServer.getUri();
        logger.info(`In-memory MongoDB started at ${fallbackUri}`);
        return await mongoose.connect(fallbackUri);
      }
      throw err;
    }
  } catch (error: any) {
    logger.error('Failed to initialize MongoDB connection:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }
}
