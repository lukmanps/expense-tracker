import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';

import authPlugin from './plugins/auth.js';
import errorHandler from './plugins/error-handler.js';

import authRoutes from './modules/auth/auth.routes.js';
import incomeRoutes from './modules/income/income.routes.js';
import expenseRoutes from './modules/expense/expense.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import transactionRoutes from './modules/transactions/transactions.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'warn',
  },
});

// Plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await fastify.register(sensible);
await fastify.register(authPlugin);
await fastify.register(errorHandler);

// Routes
fastify.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(incomeRoutes, { prefix: '/api/incomes' });
await fastify.register(expenseRoutes, { prefix: '/api/expenses' });
await fastify.register(categoryRoutes, { prefix: '/api/categories' });
await fastify.register(transactionRoutes, { prefix: '/api/transactions' });
await fastify.register(statsRoutes, { prefix: '/api/stats' });

// Start server
const PORT = parseInt(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
