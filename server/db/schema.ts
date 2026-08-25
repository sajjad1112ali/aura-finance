import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  type: text('type').notNull(),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
}, (table) => [
  index('categories_user_id_idx').on(table.userId),
]);

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  type: text('type').notNull(),
  categoryId: text('category_id').references(() => categories.id).notNull(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  recurringRuleId: text('recurring_rule_id').references(() => recurringRules.id),
  userId: text('user_id').references(() => users.id).notNull(),
}, (table) => [
  index('transactions_user_id_idx').on(table.userId),
  index('transactions_date_idx').on(table.date),
  index('transactions_category_id_idx').on(table.categoryId),
]);

export const recurringRules = sqliteTable('recurring_rules', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  type: text('type').notNull(),
  categoryId: text('category_id').references(() => categories.id).notNull(),
  description: text('description').notNull(),
  frequency: text('frequency').notNull(),
  startDate: text('start_date').notNull(),
  lastPostedDate: text('last_posted_date'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
}, (table) => [
  index('recurring_rules_user_id_idx').on(table.userId),
]);

export const extraTransactions = sqliteTable('extra_transactions', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  notes: text('notes').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
}, (table) => [
  index('extra_transactions_user_id_idx').on(table.userId),
]);
