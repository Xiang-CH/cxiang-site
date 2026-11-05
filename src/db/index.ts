import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

/**
 * PostgreSQL's OID for the `date` type.
 *
 * `pg` parses it into a JavaScript `Date` at local midnight, which loses the
 * original calendar date on any non-UTC server and contradicts the `mode:
 * "string"` the Drizzle schema declares for date columns. Returning the raw
 * `YYYY-MM-DD` text keeps those columns timezone-proof.
 */
const DATE_OID = 1082;

let pool: Pool | null = null;
let database: Database | null = null;

/**
 * Determines whether the database connection is configured.
 *
 * @returns `true` if `DATABASE_URL` is set, `false` otherwise.
 */
export function isDatabaseConfigured() {
    return Boolean(process.env.DATABASE_URL);
}

/**
 * Provides the configured Drizzle database instance, initializing it on first use.
 *
 * @returns The Drizzle database instance.
 * @throws Error if `DATABASE_URL` is not configured.
 */
export function getDb(): Database {
    if (database) return database;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not configured");
    }

    pool = new Pool({ connectionString, max: 1 });

    // Each new client needs the text parser, so this is registered per
    // connection rather than once on the pool.
    pool.on("connect", (client) => {
        client.setTypeParser(DATE_OID, "text", (value: string) => value);
    });

    attachDatabasePool(pool);
    database = drizzle(pool, { schema });
    return database;
}
