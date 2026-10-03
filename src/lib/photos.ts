import "server-only";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, isDatabaseConfigured } from "@/db";
import { photos, photosets } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { type GalleryCell, type PhotoSize } from "@/lib/gallery-shared";

/** A collection card on `/photos`: the photoset plus the one image that represents it. */
export type PhotoSetSummary = {
    id: string;
    slug: string;
    title: string;
    abstract?: string;
    shotOn?: string;
    shotOnEnd?: string;
    photoCount: number;
    cover?: GalleryCell;
};

export type PhotoSet = PhotoSetSummary & {
    photos: GalleryCell[];
};

type PhotoRow = typeof photos.$inferSelect;

function toGalleryCell(row: PhotoRow): GalleryCell {
    return {
        id: row.id,
        src: row.url,
        alt: row.alt || row.caption || "Photograph",
        caption: row.caption ?? undefined,
        width: row.width,
        height: row.height,
        size: row.size as PhotoSize,
        kind: row.kind,
        x: row.x,
        y: row.y,
        w: row.w,
        h: row.h,
        sortOrder: row.sortOrder,
    };
}

/**
 * Lists published photosets for the `/photos` index, ordered by the author's
 * `sortOrder` and then alphabetically.
 *
 * Returns a cover and a count per set without loading full photo rows: when the
 * set has an explicit `coverPhotoId` that photo is fetched, otherwise the
 * earliest photo in the set is used.
 */
export async function getPhotoSetSummaries(): Promise<PhotoSetSummary[]> {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.photos);

    if (!isDatabaseConfigured()) return [];
    const db = getDb();

    const rows = await db
        .select({
            set: photosets,
            photoCount: count(photos.id),
        })
        .from(photosets)
        .leftJoin(photos, eq(photos.photosetId, photosets.id))
        .where(eq(photosets.published, true))
        .groupBy(photosets.id)
        .orderBy(asc(photosets.sortOrder), asc(photosets.title));

    if (rows.length === 0) return [];

    const explicitCoverIds = rows
        .map((row) => row.set.coverPhotoId)
        .filter((id): id is string => Boolean(id));
    const setIds = rows.map((row) => row.set.id);

    const [coverRows, firstRows] = await Promise.all([
        explicitCoverIds.length > 0
            ? db.select().from(photos).where(inArray(photos.id, explicitCoverIds))
            : Promise.resolve([] as PhotoRow[]),
        db
            .select()
            .from(photos)
            .where(inArray(photos.photosetId, setIds))
            .orderBy(asc(photos.sortOrder), asc(photos.createdAt)),
    ]);

    const coversById = new Map(coverRows.map((row) => [row.id, row]));
    const firstBySetId = new Map<string, PhotoRow>();
    for (const row of firstRows) {
        if (!firstBySetId.has(row.photosetId)) firstBySetId.set(row.photosetId, row);
    }

    return rows.map(({ set, photoCount }) => {
        const explicit = set.coverPhotoId ? coversById.get(set.coverPhotoId) : undefined;
        const coverRow = explicit ?? firstBySetId.get(set.id);

        return {
            id: set.id,
            slug: set.slug,
            title: set.title,
            abstract: set.abstract ?? undefined,
            shotOn: set.shotOn ?? undefined,
            shotOnEnd: set.shotOnEnd ?? undefined,
            photoCount,
            cover: coverRow ? toGalleryCell(coverRow) : undefined,
        };
    });
}

/** Loads one published photoset and its photos in grid order, or `null` when absent. */
export async function getPhotoSet(slug: string): Promise<PhotoSet | null> {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.photos, `${CACHE_TAGS.photos}:${slug}`);

    if (!isDatabaseConfigured()) return null;
    const db = getDb();

    const [set] = await db
        .select()
        .from(photosets)
        .where(and(eq(photosets.slug, slug), eq(photosets.published, true)))
        .limit(1);

    if (!set) return null;

    const rows = await db
        .select()
        .from(photos)
        .where(eq(photos.photosetId, set.id))
        .orderBy(asc(photos.sortOrder), asc(photos.createdAt));

    const galleryPhotos = rows.map(toGalleryCell);
    const explicitCover = set.coverPhotoId
        ? galleryPhotos.find((photo) => photo.id === set.coverPhotoId)
        : undefined;

    return {
        id: set.id,
        slug: set.slug,
        title: set.title,
        abstract: set.abstract ?? undefined,
        shotOn: set.shotOn ?? undefined,
        shotOnEnd: set.shotOnEnd ?? undefined,
        photoCount: galleryPhotos.length,
        cover: explicitCover ?? galleryPhotos[0],
        photos: galleryPhotos,
    };
}
