import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      logger.info(`=======================================================`);
      logger.info(`Grant Application Completeness Assistant Backend`);
      logger.info(`Server listening on http://localhost:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/api/health`);
      logger.info(`=======================================================`);
    });

    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

startServer();
