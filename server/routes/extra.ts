import { Hono } from 'hono';
import { db } from '../db';
import { extraTransactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const extraRoutes = new Hono();

extraRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const rows = await db
      .select()
      .from(extraTransactions)
      .where(eq(extraTransactions.userId, userId))
      .all();
    return c.json(rows);
  } catch (err) {
    console.error('List extra transactions error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

extraRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const id = crypto.randomUUID();
    const row = await db
      .insert(extraTransactions)
      .values({
        id,
        amount: body.amount,
        date: body.date,
        notes: body.notes || '',
        userId,
      })
      .returning()
      .get();

    return c.json(row);
  } catch (err) {
    console.error('Create extra transaction error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

extraRoutes.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(extraTransactions)
      .where(and(eq(extraTransactions.id, id), eq(extraTransactions.userId, userId)))
      .get();

    if (!existing) {
      return c.json({ error: 'Extra transaction not found' }, 404);
    }

    const row = await db
      .update(extraTransactions)
      .set({
        amount: body.amount ?? existing.amount,
        date: body.date ?? existing.date,
        notes: body.notes ?? existing.notes,
      })
      .where(eq(extraTransactions.id, id))
      .returning()
      .get();

    return c.json(row);
  } catch (err) {
    console.error('Update extra transaction error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

extraRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(extraTransactions)
      .where(and(eq(extraTransactions.id, id), eq(extraTransactions.userId, userId)))
      .get();

    if (!existing) {
      return c.json({ error: 'Extra transaction not found' }, 404);
    }

    await db.delete(extraTransactions).where(eq(extraTransactions.id, id));

    return c.json({ ok: true });
  } catch (err) {
    console.error('Delete extra transaction error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

extraRoutes.post('/migrate', async (c) => {
  try {
    const userId = c.get('userId');
    const { extraTransactions: items } = await c.req.json();

    if (!Array.isArray(items)) {
      return c.json({ error: 'Expected an array of extra transactions' }, 400);
    }

    const values = items.map((t: Record<string, unknown>) => ({
      id: t.id || crypto.randomUUID(),
      amount: t.amount,
      date: t.date,
      notes: t.notes || '',
      createdAt: t.createdAt || new Date().toISOString(),
      userId,
    }));

    await db.insert(extraTransactions).values(values);

    return c.json({ ok: true, count: values.length });
  } catch (err) {
    console.error('Migrate extra transactions error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
