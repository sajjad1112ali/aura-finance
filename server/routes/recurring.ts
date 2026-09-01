import { Hono } from 'hono';
import { db } from '../db';
import { recurringRules, transactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { processRecurring } from '../lib/recurring';
import { dueOccurrences, todayISO } from '../../src/lib/recurring';

export const recurringRoutes = new Hono();

recurringRoutes.post('/process', async (c) => {
  try {
    const userId = c.get('userId');
    const result = await processRecurring(userId);
    return c.json(result);
  } catch (err) {
    console.error('Process recurring error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

recurringRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const rows = await db
      .select()
      .from(recurringRules)
      .where(eq(recurringRules.userId, userId))
      .all();
    return c.json(rows);
  } catch (err) {
    console.error('List recurring rules error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

recurringRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const id = crypto.randomUUID();
    const row = await db
      .insert(recurringRules)
      .values({
        id,
        amount: body.amount,
        type: body.type,
        categoryId: body.categoryId,
        description: body.description || '',
        frequency: body.frequency,
        startDate: body.startDate,
        lastPostedDate: body.lastPostedDate || null,
        userId,
      })
      .returning()
      .get();

    // Post the first due occurrence immediately (same as the old client behavior).
    const dates = dueOccurrences(body.startDate, body.frequency, undefined, todayISO());
    const firstDue = dates[0];
    if (firstDue) {
      await db.insert(transactions).values({
        id: crypto.randomUUID(),
        amount: row.amount,
        type: row.type,
        categoryId: row.categoryId,
        date: firstDue,
        description: row.description,
        createdAt: new Date().toISOString(),
        recurringRuleId: row.id,
        userId,
      });
      const updated = await db
        .update(recurringRules)
        .set({ lastPostedDate: firstDue })
        .where(eq(recurringRules.id, row.id))
        .returning()
        .get();
      return c.json(updated);
    }

    return c.json(row);
  } catch (err) {
    console.error('Create recurring rule error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

recurringRoutes.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)))
      .get();

    if (!existing) {
      return c.json({ error: 'Recurring rule not found' }, 404);
    }

    const row = await db
      .update(recurringRules)
      .set({
        amount: body.amount ?? existing.amount,
        type: body.type ?? existing.type,
        categoryId: body.categoryId ?? existing.categoryId,
        description: body.description ?? existing.description,
        frequency: body.frequency ?? existing.frequency,
        startDate: body.startDate ?? existing.startDate,
        lastPostedDate: body.lastPostedDate ?? existing.lastPostedDate,
      })
      .where(eq(recurringRules.id, id))
      .returning()
      .get();

    return c.json(row);
  } catch (err) {
    console.error('Update recurring rule error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

recurringRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.userId, userId)))
      .get();

    if (!existing) {
      return c.json({ error: 'Recurring rule not found' }, 404);
    }

    await db.delete(recurringRules).where(eq(recurringRules.id, id));

    return c.json({ ok: true });
  } catch (err) {
    console.error('Delete recurring rule error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

recurringRoutes.post('/migrate', async (c) => {
  try {
    const userId = c.get('userId');
    const { recurringRules: items } = await c.req.json();

    if (!Array.isArray(items)) {
      return c.json({ error: 'Expected an array of recurring rules' }, 400);
    }

    const values = items.map((rule: Record<string, unknown>) => ({
      id: rule.id || crypto.randomUUID(),
      amount: rule.amount,
      type: rule.type,
      categoryId: rule.categoryId,
      description: rule.description || '',
      frequency: rule.frequency,
      startDate: rule.startDate,
      lastPostedDate: rule.lastPostedDate || null,
      createdAt: rule.createdAt || new Date().toISOString(),
      userId,
    }));

    await db.insert(recurringRules).values(values);

    return c.json({ ok: true, count: values.length });
  } catch (err) {
    console.error('Migrate recurring rules error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
