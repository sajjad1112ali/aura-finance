import { Hono } from 'hono';
import { db } from '../db';
import { categories, transactions } from '../db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';

export const categoryRoutes = new Hono();

categoryRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const rows = await db
      .select()
      .from(categories)
      .where(or(isNull(categories.userId), eq(categories.userId, userId)))
      .all();
    return c.json(rows);
  } catch (err) {
    console.error('List categories error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

categoryRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const id = crypto.randomUUID();
    const row = await db
      .insert(categories)
      .values({
        id,
        name: body.name,
        icon: body.icon || 'Folder',
        color: body.color || '200 50% 50%',
        type: body.type || 'both',
        isCustom: true,
        userId,
      })
      .returning()
      .get();

    return c.json(row);
  } catch (err) {
    console.error('Create category error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

categoryRoutes.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .get();

    if (!existing) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const row = await db
      .update(categories)
      .set({
        name: body.name ?? existing.name,
        icon: body.icon ?? existing.icon,
        color: body.color ?? existing.color,
        type: body.type ?? existing.type,
      })
      .where(eq(categories.id, id))
      .returning()
      .get();

    return c.json(row);
  } catch (err) {
    console.error('Update category error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

categoryRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .get();

    if (!existing) {
      return c.json({ error: 'Category not found' }, 404);
    }

    if (existing.userId !== userId || !existing.isCustom) {
      return c.json({ error: 'Cannot delete default category' }, 403);
    }

    const inUse = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.categoryId, id))
      .limit(1)
      .get();

    if (inUse) {
      return c.json({ error: 'Category is in use by transactions' }, 409);
    }

    await db.delete(categories).where(eq(categories.id, id));

    return c.json({ ok: true });
  } catch (err) {
    console.error('Delete category error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

categoryRoutes.post('/migrate', async (c) => {
  try {
    const userId = c.get('userId');
    const { categories: items } = await c.req.json();

    if (!Array.isArray(items)) {
      return c.json({ error: 'Expected an array of categories' }, 400);
    }

    const values = items.map((cat: Record<string, unknown>) => ({
      id: cat.id || crypto.randomUUID(),
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      isCustom: cat.isCustom ?? false,
      userId,
    }));

    await db.insert(categories).values(values);

    return c.json({ ok: true, count: values.length });
  } catch (err) {
    console.error('Migrate categories error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
