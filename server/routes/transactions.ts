import { Hono } from 'hono';
import { db } from '../db';
import { transactions } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export const transactionRoutes = new Hono();

transactionRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const from = c.req.query('from');
    const to = c.req.query('to');
    const conditions = [eq(transactions.userId, userId)];
    if (from) conditions.push(gte(transactions.date, from));
    if (to) conditions.push(lte(transactions.date, to));
    const rows = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .all();
    return c.json(rows);
  } catch (err) {
    console.error('List transactions error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

transactionRoutes.get('/years', async (c) => {
  try {
    const userId = c.get('userId');
    const rows = await db
      .select({ year: sql<string>`substr(${transactions.date}, 1, 4)` })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .groupBy(sql`substr(${transactions.date}, 1, 4)`)
      .all();
    const years = rows.map((r) => r.year).filter(Boolean).sort((a, b) => b.localeCompare(a));
    return c.json(years);
  } catch (err) {
    console.error('List transaction years error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

transactionRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const id = crypto.randomUUID();
    const row = await db
      .insert(transactions)
      .values({
        id,
        amount: body.amount,
        type: body.type,
        categoryId: body.categoryId,
        date: body.date,
        description: body.description || '',
        recurringRuleId: body.recurringRuleId || null,
        userId,
      })
      .returning()
      .get();

    return c.json(row);
  } catch (err) {
    console.error('Create transaction error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

transactionRoutes.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .get();

    if (!existing) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    const row = await db
      .update(transactions)
      .set({
        amount: body.amount ?? existing.amount,
        type: body.type ?? existing.type,
        categoryId: body.categoryId ?? existing.categoryId,
        date: body.date ?? existing.date,
        description: body.description ?? existing.description,
      })
      .where(eq(transactions.id, id))
      .returning()
      .get();

    return c.json(row);
  } catch (err) {
    console.error('Update transaction error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

transactionRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .get();

    if (!existing) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    await db.delete(transactions).where(eq(transactions.id, id));

    return c.json({ ok: true });
  } catch (err) {
    console.error('Delete transaction error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

transactionRoutes.post('/migrate', async (c) => {
  try {
    const userId = c.get('userId');
    const { transactions: items } = await c.req.json();

    if (!Array.isArray(items)) {
      return c.json({ error: 'Expected an array of transactions' }, 400);
    }

    const values = items.map((t: Record<string, unknown>) => ({
      id: t.id || crypto.randomUUID(),
      amount: t.amount,
      type: t.type,
      categoryId: t.categoryId,
      date: t.date,
      description: t.description || '',
      createdAt: t.createdAt || new Date().toISOString(),
      recurringRuleId: t.recurringRuleId || null,
      userId,
    }));

    await db.insert(transactions).values(values);

    return c.json({ ok: true, count: values.length });
  } catch (err) {
    console.error('Migrate transactions error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
