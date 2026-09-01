import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, categories } from '../db/schema';
import { eq, isNull, and, isNotNull } from 'drizzle-orm';
import { signJwt } from '../lib/jwt';
import { authMiddleware } from '../middleware/auth';
import { DEFAULT_CATEGORIES } from '../../src/services/seed';

export const authRoutes = new Hono();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60,
};

async function ensureDefaultCategories() {
  const globalDefaults = await db
    .select()
    .from(categories)
    .where(and(eq(categories.isCustom, false), isNull(categories.userId)))
    .limit(1)
    .get();
  if (globalDefaults) return;

  await db
    .delete(categories)
    .where(and(eq(categories.isCustom, false), isNotNull(categories.userId)));

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((cat) => ({
      id: crypto.randomUUID(),
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      isCustom: false,
      userId: null,
    }))
  );
}

authRoutes.post('/sign-up', async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ error: 'Name, email, and password are required' }, 400);
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return c.json({ error: 'Email already in use' }, 409);
    }

    await ensureDefaultCategories();

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);

    await db.insert(users).values({ id, name, email, passwordHash });

    const token = signJwt({ sub: id, email, name });

    setCookie(c, 'auth', token, COOKIE_OPTIONS);

    return c.json({ user: { id, name, email } });
  } catch (err) {
    console.error('Sign-up error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

authRoutes.post('/sign-in', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const token = signJwt({ sub: user.id, email: user.email, name: user.name });

    setCookie(c, 'auth', token, COOKIE_OPTIONS);

    return c.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Sign-in error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

authRoutes.post('/sign-out', async (c) => {
  deleteCookie(c, 'auth', { path: '/' });
  return c.json({ ok: true });
});

authRoutes.get('/me', authMiddleware, async (c) => {
  return c.json({
    user: {
      id: c.get('userId'),
      name: c.get('userName'),
      email: c.get('userEmail'),
    },
  });
});
