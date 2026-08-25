import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyJwt } from '../lib/jwt';

export async function authMiddleware(c: Context, next: Next) {
  let token = getCookie(c, 'auth');

  if (!token) {
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', payload.sub);
  c.set('userEmail', payload.email);
  c.set('userName', payload.name);

  await next();
}
