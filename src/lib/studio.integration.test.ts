import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

/**
 * Integration test for the Studio save path.
 *
 * The batched `UPDATE ... CASE` guarded here has a failure mode that a unit test
 * cannot see: parameters in an all-parameter `CASE` resolve to `text`, which then
 * cannot assign into an `integer` column. It therefore needs a real Postgres and
 * is skipped unless `TEST_DATABASE_URL` points at one.
 *
 * The search path is per-connection and `studio.ts` builds its own pool, so it
 * has to travel in the connection string rather than being set by the pool below:
 *
 *   TEST_DATABASE_URL='postgresql://user@127.0.0.1:5432/postgres?options=-c%20search_path%3Dstudio_save_test' \
 *   bun run test
 *
 * Everything is created in a dedicated schema and dropped afterwards, so the
 * target database is left as it was found.
 */
const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDb = connectionString ? describe : describe.skip;

const SCHEMA = "studio_save_test";

describeWithDb("savePhotoSet against a real database", () => {
    let savePhotoSet: typeof import("./studio").savePhotoSet;
    let pool: Pool;

    beforeAll(async () => {
        // `studio.ts` boots its Drizzle pool from this variable on first use.
        process.env.DATABASE_URL = connectionString;

        pool = new Pool({
            connectionString,
            max: 1,
            // Setting the search path through connection options avoids issuing
            // a query on a client that pg is still setting up.
            options: `-c search_path=${SCHEMA},public`,
        });
        await pool.query(`drop schema if exists ${SCHEMA} cascade`);
        await pool.query(`create schema ${SCHEMA}`);
        await pool.query(`
            create table ${SCHEMA}.photosets (
                id varchar(36) primary key,
                slug varchar(255) not null,
                title varchar(255) not null,
                abstract text,
                shot_on date,
                shot_on_end date,
                published boolean not null default false,
                cover_photo_id varchar(36),
                sort_order integer not null default 0,
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now()
            )
        `);
        await pool.query(`
            create table ${SCHEMA}.photos (
                id varchar(36) primary key,
                photoset_id varchar(36) not null references ${SCHEMA}.photosets(id) on delete cascade,
                url text not null,
                storage_key text,
                alt varchar(500) not null default '',
                caption varchar(500),
                width integer not null,
                height integer not null,
                kind varchar(16) not null default 'photo',
                x integer,
                y integer,
                w integer,
                h integer,
                size varchar(16) not null default 'medium',
                sort_order integer not null default 0,
                created_at timestamptz not null default now()
            )
        `);

        ({ savePhotoSet } = await import("./studio"));
    });

    afterAll(async () => {
        if (!pool) return;
        await pool.query(`drop schema if exists ${SCHEMA} cascade`);
        await pool.end();
    });

    const photo = (url: string, size: string, alt = "") =>
        ({ url, width: 1600, height: 1067, size: size as never, alt }) as never;

    it("inserts a photoset then updates it through the batched CASE path", async () => {
        const { id } = await savePhotoSet(null, {
            title: "Update Path",
            slug: "update-path",
            published: true,
            shotOn: "2025-03-14",
            shotOnEnd: "2025-05-02",
            photos: [photo("https://cdn.example/a.jpg", "medium")],
        });

        // The regression: several rows, mixed sizes and an empty alt used to fail
        // with `column "sort_order" is of type integer but expression is of type text`.
        await savePhotoSet(id, {
            title: "Update Path Edited",
            slug: "update-path",
            published: true,
            shotOn: "2025-03-14",
            shotOnEnd: "2025-05-02",
            photos: [
                photo("https://cdn.example/c.jpg", "wide", ""),
                photo("https://cdn.example/a.jpg", "medium", "Mist"),
                photo("https://cdn.example/b.jpg", "small", "Second"),
            ],
        });

        const rows = await pool.query(
            `select sort_order, size, alt, url from ${SCHEMA}.photos order by sort_order`
        );

        expect(rows.rows).toEqual([
            { sort_order: 0, size: "wide", alt: "", url: "https://cdn.example/c.jpg" },
            { sort_order: 1, size: "medium", alt: "Mist", url: "https://cdn.example/a.jpg" },
            { sort_order: 2, size: "small", alt: "Second", url: "https://cdn.example/b.jpg" },
        ]);
    });

    it("stores the shoot range on the row", async () => {
        const { id } = await savePhotoSet(null, {
            title: "Ranged",
            slug: "ranged",
            published: true,
            shotOn: "2024-11-02",
            shotOnEnd: "2025-02-20",
            photos: [photo("https://cdn.example/d.jpg", "large")],
        });

        const result = await pool.query(
            `select shot_on::text as start, shot_on_end::text as "end" from ${SCHEMA}.photosets where id = $1`,
            [id]
        );

        expect(result.rows[0]).toEqual({ start: "2024-11-02", end: "2025-02-20" });
    });

    it("drops photos that are no longer submitted", async () => {
        const { id } = await savePhotoSet(null, {
            title: "Shrinking",
            slug: "shrinking",
            published: true,
            photos: [photo("https://cdn.example/e.jpg", "small")],
        });

        const before = await pool.query(`select id from ${SCHEMA}.photos where photoset_id = $1`, [
            id,
        ]);
        expect(before.rowCount).toBe(1);

        await savePhotoSet(id, {
            title: "Shrinking",
            slug: "shrinking",
            published: true,
            photos: [],
        });

        const after = await pool.query(`select id from ${SCHEMA}.photos where photoset_id = $1`, [
            id,
        ]);
        expect(after.rowCount).toBe(0);
    });

    it("rejects a duplicate slug", async () => {
        await savePhotoSet(null, {
            title: "First",
            slug: "duplicate-slug",
            published: true,
            photos: [],
        });

        await expect(
            savePhotoSet(null, {
                title: "Second",
                slug: "duplicate-slug",
                published: true,
                photos: [],
            })
        ).rejects.toThrow(/already exists/);
    });

    it("round-trips explicit coordinates and a spacer through the batched update", async () => {
        const base = { title: "Freeform", slug: "freeform", published: true };

        const { id } = await savePhotoSet(null, {
            ...base,
            photos: [
                {
                    kind: "photo",
                    url: "https://cdn.example/a.jpg",
                    width: 1600,
                    height: 1000,
                    alt: "a",
                    size: "medium",
                    x: 0,
                    y: 0,
                    w: 6,
                    h: 4,
                },
            ],
        });

        // The second save exercises the batched CASE update, including the null
        // placement and url values that a spacer carries.
        await savePhotoSet(id, {
            ...base,
            photos: [
                {
                    kind: "photo",
                    url: "https://cdn.example/a.jpg",
                    width: 1600,
                    height: 1000,
                    alt: "moved",
                    size: "medium",
                    x: 3,
                    y: 2,
                    w: 5,
                    h: 6,
                },
                { kind: "spacer", alt: "", size: "medium", x: 8, y: 0, w: 4, h: 3 },
            ],
        });

        const rows = await pool.query(
            `select kind, x, y, w, h, alt, url from ${SCHEMA}.photos
             where photoset_id = $1 order by sort_order`,
            [id]
        );

        expect(rows.rows).toEqual([
            {
                kind: "photo",
                x: 3,
                y: 2,
                w: 5,
                h: 6,
                alt: "moved",
                url: "https://cdn.example/a.jpg",
            },
            { kind: "spacer", x: 8, y: 0, w: 4, h: 3, alt: "", url: "" },
        ]);
    });

    it("stores a spacer-only collection", async () => {
        const { id } = await savePhotoSet(null, {
            title: "Sparse",
            slug: "sparse",
            published: true,
            photos: [{ kind: "spacer", alt: "", size: "medium", x: 0, y: 0, w: 4, h: 4 }],
        });

        const rows = await pool.query(
            `select count(*)::int as n from ${SCHEMA}.photos where photoset_id = $1`,
            [id]
        );
        expect(rows.rows[0].n).toBe(1);
    });
});

describeWithDb("collection summary query", () => {
    let pool: Pool;
    const SCHEMA3 = "studio_summary_test";

    beforeAll(async () => {
        pool = new Pool({
            connectionString,
            max: 1,
            options: `-c search_path=${SCHEMA3},public`,
        });
        await pool.query(`drop schema if exists ${SCHEMA3} cascade`);
        await pool.query(`create schema ${SCHEMA3}`);
        await pool.query(`
            create table ${SCHEMA3}.photosets (
                id varchar(36) primary key, slug varchar(255) not null, title varchar(255) not null,
                published boolean not null default false
            )
        `);
        await pool.query(`
            create table ${SCHEMA3}.photos (
                id varchar(36) primary key,
                photoset_id varchar(36) not null references ${SCHEMA3}.photosets(id) on delete cascade,
                url text not null, alt varchar(500) not null default '',
                width integer not null, height integer not null,
                kind varchar(16) not null default 'photo',
                size varchar(16) not null default 'medium',
                sort_order integer not null default 0,
                created_at timestamptz not null default now()
            )
        `);

        await pool.query(`insert into ${SCHEMA3}.photosets (id, slug, title, published) values
            ('s1','one','One',true), ('s2','two','Two',true), ('s3','empty','Empty',true)`);
        // s1 has three photos; the summary must pick the lowest sort_order.
        await pool.query(`insert into ${SCHEMA3}.photos
            (id, photoset_id, url, alt, width, height, sort_order, created_at) values
            ('p3','s1','u3','third',10,10,30,now()),
            ('p1','s1','u1','first',10,10,10,now()),
            ('p2','s1','u2','second',10,10,20,now()),
            ('p4','s2','u4','only',10,10,5,now())`);
    });

    afterAll(async () => {
        if (!pool) return;
        await pool.query(`drop schema if exists ${SCHEMA3} cascade`);
        await pool.end();
    });

    it("returns one first-photo row per set, in grid order", async () => {
        const result = await pool.query(`
            with first_in_set as (
                select id,
                       row_number() over (
                           partition by photoset_id order by sort_order, created_at
                       ) as rank
                from ${SCHEMA3}.photos
            )
            select p.photoset_id, p.id, p.alt
            from ${SCHEMA3}.photos p
            join first_in_set f on f.id = p.id
            where f.rank = 1
            order by p.photoset_id
        `);

        // Exactly one row per set that has photos — never three for s1.
        expect(result.rows).toEqual([
            { photoset_id: "s1", id: "p1", alt: "first" },
            { photoset_id: "s2", id: "p4", alt: "only" },
        ]);
        expect(result.rows).toHaveLength(2);
    });
});
