import { env } from './config/env';
import prisma from './config/prisma';
import app from './app';

async function bootstrap() {
  try {
    // Verify database connection before starting
    await prisma.$connect();
    console.info('Database connected');

    const server = app.listen(env.PORT, () => {
      console.info(`Server running on http://localhost:${env.PORT}`);
      console.info(`Environment: ${env.NODE_ENV}`);
      console.info(`Website Locker API ready`);
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      console.info(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.info('Database disconnected. Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
