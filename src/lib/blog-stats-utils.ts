const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNSAFE_SLUG_CHARACTER = /[\u0000-\u001F\u007F/]/;

/**
 * Determines whether the blog statistics configuration is available.
 *
 * @param databaseUrl - The database connection URL
 * @param hashSecret - The secret used for hashing
 * @returns `true` if both configuration values are truthy, `false` otherwise.
 */
export function hasBlogStatsConfiguration(
    databaseUrl: string | undefined,
    hashSecret: string | undefined
) {
    return Boolean(databaseUrl && hashSecret);
}

/**
 * Determines whether a blog slug meets the required format and character constraints.
 *
 * @param slug - The blog slug to validate
 * @returns `true` if the slug is valid, `false` otherwise.
 */
export function isValidBlogSlug(slug: string) {
    return (
        slug.length > 0 &&
        slug.length <= 255 &&
        slug.trim() === slug &&
        slug !== "." &&
        slug !== ".." &&
        !UNSAFE_SLUG_CHARACTER.test(slug)
    );
}

/**
 * Determines whether a value matches the expected visitor ID format.
 *
 * @param value - The value to validate
 * @returns `true` if the value matches the visitor ID pattern, `false` otherwise.
 */
export function isVisitorId(value: string | undefined): value is string {
    return Boolean(value && VISITOR_ID_PATTERN.test(value));
}

/**
 * Extracts a valid blog slug from a URL or path.
 *
 * @param value - The URL or path to inspect
 * @returns The decoded blog slug, or `null` if the value does not contain a valid blog path
 */
export function getBlogSlugFromPath(value: unknown): string | null {
    if (typeof value !== "string") return null;

    let pathname: string;
    try {
        pathname = new URL(value, "https://cxiang.site").pathname;
    } catch {
        return null;
    }

    const match = /^\/blog\/([^/]+)\/?$/.exec(pathname);
    if (!match) return null;

    try {
        const slug = decodeURIComponent(match[1]);
        return isValidBlogSlug(slug) && !slug.endsWith(".md") ? slug : null;
    } catch {
        return null;
    }
}
