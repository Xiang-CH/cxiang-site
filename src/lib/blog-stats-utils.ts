const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNSAFE_SLUG_CHARACTER = /[\u0000-\u001F\u007F/]/;

export function hasBlogStatsConfiguration(
    databaseUrl: string | undefined,
    hashSecret: string | undefined
) {
    return Boolean(databaseUrl && hashSecret);
}

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

export function isVisitorId(value: string | undefined): value is string {
    return Boolean(value && VISITOR_ID_PATTERN.test(value));
}

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
