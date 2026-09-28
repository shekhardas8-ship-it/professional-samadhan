// src/db/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const dbCredentials = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.SQL_HOST || '127.0.0.1',
      user: process.env.SQL_ADMIN_USER || 'postgres',
      password: process.env.SQL_ADMIN_PASSWORD || 'postgres',
      database: process.env.SQL_DB_NAME || 'postgres',
      ssl: false,
    };

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials,
  verbose: true,
});
