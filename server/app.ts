import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { transactionRoutes } from './routes/transactions';
import { categoryRoutes } from './routes/categories';
import { recurringRoutes } from './routes/recurring';
import { extraRoutes } from './routes/extra';
import { authMiddleware } from './middleware/auth';

const app = new Hono().basePath('/api');

app.use('/*', cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.VERCEL_URL || '' : 'http://localhost:8080',
  credentials: true,
}));

app.route('/auth', authRoutes);

const protectedApp = new Hono();
protectedApp.use('/*', authMiddleware);
protectedApp.route('/transactions', transactionRoutes);
protectedApp.route('/categories', categoryRoutes);
protectedApp.route('/recurring', recurringRoutes);
protectedApp.route('/extra', extraRoutes);

app.route('/', protectedApp);

export default app;
