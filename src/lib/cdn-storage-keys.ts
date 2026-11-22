/**
 * Pure helpers for naming photo objects in the CDN bucket.
 *
 * Kept out of `lib/cdn-storage.ts` (which is `server-only` and pulls in the S3
 * SDK) so the security-relevant key validation can be unit tested.
 */

export const DEFAULT_PHOTO_PREFIX = "photos";

/** Extensions the Studio accepts. Anything else is stored as `.jpg`. */
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"]);

/** Normalizes a configured prefix into the leading path segment, without slashes. */
export function normalizePhotoPrefix(value: string | undefined): string {
    const trimmed = (value ?? "").trim().replace(/^\/+|\/+$/g, "");
    return trimmed || DEFAULT_PHOTO_PREFIX;
}

function slugifyFilename(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, "");
    const slug = base
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    return slug || "photo";
}

/**
 * Builds a collision-resistant object key such as
 * `photos/1730000000-sunset-over-the-bay.jpg`.
 *
 * The timestamp prefix means a re-upload never overwrites an existing object,
 * which matters because the image optimizer caches by URL.
 *
 * @param filename - Original file name, used for the readable part of the key.
 * @param now - Timestamp to embed; injectable for deterministic tests.
 * @param prefix - Key prefix, already normalized.
 */
export function buildStorageKey(
    filename: string,
    now: number = Date.now(),
    prefix: string = DEFAULT_PHOTO_PREFIX
): string {
    const match = filename.match(/\.([A-Za-z0-9]+)$/);
    const extension = (match?.[1] ?? "jpg").toLowerCase();
    const safeExtension = ALLOWED_EXTENSIONS.has(extension) ? extension : "jpg";
    return `${prefix}/${now}-${slugifyFilename(filename)}.${safeExtension}`;
}

/**
 * Validates an object key before it is used for a delete.
 *
 * A key must sit inside the photo prefix, must not contain `..`, and may only
 * use a conservative character set — otherwise the API refuses to touch the
 * bucket rather than risk deleting an unrelated object.
 *
 * @returns The key when it is safe to use, otherwise `null`.
 */
export function assertSafeStorageKey(
    key: string,
    prefix: string = DEFAULT_PHOTO_PREFIX
): string | null {
    if (!key.startsWith(`${prefix}/`)) return null;
    if (key.includes("..")) return null;
    if (!/^[A-Za-z0-9/_.-]+$/.test(key)) return null;
    return key;
}
