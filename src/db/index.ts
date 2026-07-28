import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let pool: Pool | null = null;
let database: Database | null = null;

export function isDatabaseConfigured() {
    return Boolean(process.env.DATABASE_URL);
}

/**
 * Creates the database connection only at request time so builds without
 * production secrets can still succeed.
 */
export function getDb(): Database {
    if (database) return database;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not configured");
    }

    pool = new Pool({ connectionString, max: 1 });
    attachDatabasePool(pool);
    database = drizzle(pool, { schema });
    return database;
}
