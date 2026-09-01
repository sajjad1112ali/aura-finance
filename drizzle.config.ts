import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const isProd = process.env.DB_ENV === 'production';

export default defineConfig({
  out: './drizzle',
  schema: './server/db/schema.ts',
  ...(isProd
    ? {
        dialect: 'turso',
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : {
        dialect: 'sqlite',
        dbCredentials: { url: 'file:local.db' },
      }),
});
