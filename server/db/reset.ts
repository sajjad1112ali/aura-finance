import 'dotenv/config';
import { db } from './index';
import { users, categories, transactions, recurringRules, extraTransactions } from './schema';

async function reset() {
  await db.delete(extraTransactions);
  await db.delete(transactions);
  await db.delete(recurringRules);
  await db.delete(categories);
  await db.delete(users);
  console.log('All tables cleared.');
}

reset().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});