import "server-only";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { photos, photosets } from "@/db/schema";
import { deletePhotoObject } from "@/lib/cdn-storage";
import { type PhotoSetInput, type StudioPhotoSet } from "@/lib/photoset-payload";
import { type PhotoSize } from "@/lib/gallery-shared";

/**
 * Write-side access to photosets for the Studio.
 *
 * Unlike `lib/photos.ts` this reads unpublished drafts too and is never cached,
 * so an editor always round-trips against the live rows.
 */

export class StudioUnavailableError extends Error {
    constructor(message = "The database is not configured") {
        super(message);
        this.name = "StudioUnavailableError";
    }
}

/** SQL type names used to annotate parameter branches of a batched CASE update. */
type SqlCast = "int" | "text" | "varchar";

export class DuplicateSlugError extends Error {
    constructor(slug: string) {
        super(`A photoset with the slug "${slug}" already exists`);
        this.name = "DuplicateSlugError";
    }
}

function requireDb() {
    if (!isDatabaseConfigured()) throw new StudioUnavailableError();
    return getDb();
}

/** Total photo count per set, keyed by photoset id. */
async function countPhotosBySet(setIds: string[]): Promise<Map<string, number>> {
    if (setIds.length === 0) return new Map();
    const rows = await getDb()
        .select({ photosetId: photos.photosetId, id: photos.id })
        .from(photos)
        .where(inArray(photos.photosetId, setIds));

    const counts = new Map<string, number>();
    for (const row of rows) {
        counts.set(row.photosetId, (counts.get(row.photosetId) ?? 0) + 1);
    }
    return counts;
}

/** Every photoset, drafts included, for the Studio index. */
export async function listPhotoSets(): Promise<
    Array<Omit<StudioPhotoSet, "photos"> & { photoCount: number }>
> {
    const db = requireDb();

    const sets = await db
        .select()
        .from(photosets)
        .orderBy(asc(photosets.sortOrder), asc(photosets.title));

    const counts = await countPhotosBySet(sets.map((set) => set.id));

    return sets.map((set) => ({
        id: set.id,
        slug: set.slug,
        title: set.title,
        abstract: set.abstract ?? undefined,
        shotOn: set.shotOn ?? undefined,
        shotOnEnd: set.shotOnEnd ?? undefined,
        published: set.published,
        coverPhotoId: set.coverPhotoId ?? undefined,
        updatedAt: set.updatedAt.toISOString(),
        photoCount: counts.get(set.id) ?? 0,
    }));
}

/** Loads one photoset by id for editing, including unpublished ones. */
export async function getPhotoSetForEditing(id: string): Promise<StudioPhotoSet | null> {
    const db = requireDb();

    const [set] = await db.select().from(photosets).where(eq(photosets.id, id)).limit(1);
    if (!set) return null;

    const rows = await db
        .select()
        .from(photos)
        .where(eq(photos.photosetId, set.id))
        .orderBy(asc(photos.sortOrder), asc(photos.createdAt));

    return {
        id: set.id,
        slug: set.slug,
        title: set.title,
        abstract: set.abstract ?? undefined,
        shotOn: set.shotOn ?? undefined,
        shotOnEnd: set.shotOnEnd ?? undefined,
        published: set.published,
        coverPhotoId: set.coverPhotoId ?? undefined,
        updatedAt: set.updatedAt.toISOString(),
        photos: rows.map((row) => ({
            id: row.id,
            kind: row.kind as "photo" | "spacer",
            url: row.url || undefined,
            storageKey: row.storageKey ?? undefined,
            alt: row.alt,
            caption: row.caption ?? undefined,
            width: row.width,
            height: row.height,
            x: row.x ?? undefined,
            y: row.y ?? undefined,
            w: row.w ?? undefined,
            h: row.h ?? undefined,
            size: row.size as PhotoSize,
        })),
    };
}

/**
 * Creates a photoset, or replaces the contents of an existing one.
 *
 * The submitted photo array is authoritative: photos that already exist but are
 * absent from it are deleted (and their bucket objects removed), and the array
 * position becomes each photo's `sortOrder`.
 */
export async function savePhotoSet(
    existingId: string | null,
    input: PhotoSetInput
): Promise<{ id: string }> {
    const db = requireDb();

    const duplicate = await db
        .select({ id: photosets.id })
        .from(photosets)
        .where(eq(photosets.slug, input.slug))
        .limit(1);

    if (duplicate[0] && duplicate[0].id !== existingId) {
        throw new DuplicateSlugError(input.slug);
    }

    const previous = existingId
        ? await db.select().from(photos).where(eq(photos.photosetId, existingId))
        : [];
    const existingIds = new Set(previous.map((row) => row.id));

    // Assign ids before writing so the cover can be resolved from either an id
    // or an array index, even when it points at a photo created right now.
    const prepared = input.photos.map((photo, index) => ({
        id: photo.id && existingIds.has(photo.id) ? photo.id : crypto.randomUUID(),
        isExisting: Boolean(photo.id && existingIds.has(photo.id)),
        row: {
            photosetId: existingId ?? "",
            url: photo.url ?? "",
            storageKey: photo.storageKey ?? null,
            alt: photo.alt,
            caption: photo.caption ?? null,
            // Spacers carry no image; the columns are NOT NULL, so store a
            // placeholder size that nothing reads.
            width: photo.width ?? 1,
            height: photo.height ?? 1,
            kind: photo.kind,
            x: photo.x ?? null,
            y: photo.y ?? null,
            w: photo.w ?? null,
            h: photo.h ?? null,
            size: photo.size,
            sortOrder: index,
        },
    }));

    const submittedIds = new Set(prepared.filter((entry) => entry.isExisting).map((e) => e.id));
    const removed = previous.filter((row) => !submittedIds.has(row.id));

    const coverPhotoId =
        input.coverPhotoId && prepared.some((entry) => entry.id === input.coverPhotoId)
            ? input.coverPhotoId
            : input.coverIndex !== undefined && prepared[input.coverIndex]
              ? prepared[input.coverIndex].id
              : null;

    const id = existingId ?? crypto.randomUUID();
    const now = new Date();

    await db.transaction(async (tx) => {
        if (existingId) {
            await tx
                .update(photosets)
                .set({
                    slug: input.slug,
                    title: input.title,
                    abstract: input.abstract ?? null,
                    shotOn: input.shotOn ?? null,
                    shotOnEnd: input.shotOnEnd ?? null,
                    published: input.published,
                    coverPhotoId,
                    updatedAt: now,
                })
                .where(eq(photosets.id, existingId));
        } else {
            await tx.insert(photosets).values({
                id,
                slug: input.slug,
                title: input.title,
                abstract: input.abstract ?? null,
                shotOn: input.shotOn ?? null,
                shotOnEnd: input.shotOnEnd ?? null,
                published: input.published,
                coverPhotoId,
            });
        }

        if (removed.length > 0) {
            await tx.delete(photos).where(
                inArray(
                    photos.id,
                    removed.map((row) => row.id)
                )
            );
        }

        // One batched statement per direction keeps a large save from becoming
        // hundreds of round-trips on a pooled serverless connection.
        const inserts = prepared.filter((entry) => !entry.isExisting);
        const updates = prepared.filter((entry) => entry.isExisting);

        if (inserts.length > 0) {
            await tx
                .insert(photos)
                .values(inserts.map((entry) => ({ id: entry.id, ...entry.row, photosetId: id })));
        }

        if (updates.length > 0) {
            // A CASE whose branches are all bare parameters has no inferable
            // type, and Postgres resolves those to `text` — which then fails to
            // assign into `integer`/`varchar` columns. Each branch is therefore
            // annotated with its destination type. A null branch needs the cast
            // too, or the CASE would have no type at all.
            const buildCase = (
                values: Array<{ id: string; value: string | number | null }>,
                cast: SqlCast
            ) => {
                const branches = values.map((entry) =>
                    entry.value === null
                        ? sql`when ${photos.id} = ${entry.id} then null::${sql.raw(cast)}`
                        : sql`when ${photos.id} = ${entry.id} then ${entry.value}::${sql.raw(cast)}`
                );
                return sql`case ${sql.join(branches, sql` `)} end`;
            };

            const column = (key: "sortOrder" | "size" | "alt" | "x" | "y" | "w" | "h" | "kind") =>
                updates.map((entry) => ({ id: entry.id, value: entry.row[key] ?? null }));

            await tx
                .update(photos)
                .set({
                    sortOrder: buildCase(column("sortOrder"), "int"),
                    size: buildCase(column("size"), "varchar"),
                    alt: buildCase(column("alt"), "text"),
                    kind: buildCase(column("kind"), "varchar"),
                    x: buildCase(column("x"), "int"),
                    y: buildCase(column("y"), "int"),
                    w: buildCase(column("w"), "int"),
                    h: buildCase(column("h"), "int"),
                })
                .where(
                    inArray(
                        photos.id,
                        updates.map((entry) => entry.id)
                    )
                );
        }
    });

    // Object cleanup is best-effort: a failure here must not undo a save that
    // already committed, so the file would merely be orphaned in the bucket.
    for (const row of removed) {
        if (!row.storageKey) continue;
        try {
            await deletePhotoObject(row.storageKey);
        } catch (error) {
            console.error(`Failed to delete CDN object ${row.storageKey}`, error);
        }
    }

    return { id };
}

/** Deletes a photoset; photos and their bucket objects go with it. */
export async function deletePhotoSet(id: string): Promise<boolean> {
    const db = requireDb();

    const rows = await db.select().from(photos).where(eq(photos.photosetId, id));
    const deleted = await db.delete(photosets).where(eq(photosets.id, id)).returning({
        id: photosets.id,
    });

    if (deleted.length === 0) return false;

    for (const row of rows) {
        if (!row.storageKey) continue;
        try {
            await deletePhotoObject(row.storageKey);
        } catch (error) {
            console.error(`Failed to delete CDN object ${row.storageKey}`, error);
        }
    }

    return true;
}
