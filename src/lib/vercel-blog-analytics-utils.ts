import { getBlogSlugFromPath } from "./blog-stats-utils";

const MAX_PATH_GROUPS = 100;
const RECONCILIATION_DAYS = 2;

export type DailyBlogPageviewRollup = {
    slug: string;
    viewedOn: string;
    pageViews: number;
};

type VercelAnalyticsResponse = {
    data?: unknown;
};

/**
 * Computes the preceding complete UTC dates for reconciliation.
 *
 * @param now - The reference date and time used to determine the current UTC date
 * @returns ISO-formatted UTC dates in chronological order
 */
export function getPreviousCompleteUtcDates(now = new Date()) {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    return Array.from({ length: RECONCILIATION_DAYS }, (_, index) => {
        const date = new Date(today - (RECONCILIATION_DAYS - index) * 24 * 60 * 60 * 1000);
        return date.toISOString().slice(0, 10);
    });
}

/**
 * Creates the UTC time range covering a specified calendar day.
 *
 * @param viewedOn - The date in `YYYY-MM-DD` format.
 * @returns The UTC start and end timestamps for the date.
 */
export function getUtcDayRange(viewedOn: string) {
    return {
        since: `${viewedOn}T00:00:00.000Z`,
        until: `${viewedOn}T23:59:59.999Z`,
    };
}

/**
 * Extracts and validates the pageview count from an analytics record.
 *
 * @param record - The analytics record containing a single numeric pageview metric.
 * @returns The non-negative safe integer pageview count.
 */
function getPageViews(record: Record<string, unknown>) {
    const metrics = Object.entries(record).filter(
        (entry): entry is [string, number] =>
            entry[0] !== "requestPath" && typeof entry[1] === "number"
    );

    if (metrics.length !== 1) {
        throw new Error("Vercel Analytics returned an unexpected pageview response.");
    }

    const [, pageViews] = metrics[0];
    if (!Number.isSafeInteger(pageViews) || pageViews < 0) {
        throw new Error("Vercel Analytics returned an invalid pageview count.");
    }

    return pageViews;
}

/**
 * Aggregates Vercel Analytics pageview data into daily blog rollups.
 *
 * @param payload - The Vercel Analytics response containing pageview records
 * @param viewedOn - The date associated with the rollups
 * @returns Blog rollups grouped by slug and sorted lexicographically by slug
 */
export function extractDailyBlogPageviewRollups(
    payload: VercelAnalyticsResponse,
    viewedOn: string
): DailyBlogPageviewRollup[] {
    if (!Array.isArray(payload.data)) {
        throw new Error("Vercel Analytics returned no pageview data.");
    }

    const totals = new Map<string, number>();
    for (const row of payload.data) {
        if (!row || typeof row !== "object") {
            throw new Error("Vercel Analytics returned an invalid pageview row.");
        }

        const record = row as Record<string, unknown>;
        if (record.requestPath === "Others") {
            throw new Error(
                `Vercel Analytics exceeded the ${MAX_PATH_GROUPS}-path limit; cannot safely sync blog pageviews.`
            );
        }

        const slug = getBlogSlugFromPath(record.requestPath);
        if (!slug) continue;

        totals.set(slug, (totals.get(slug) ?? 0) + getPageViews(record));
    }

    return [...totals]
        .map(([slug, pageViews]) => ({ slug, viewedOn, pageViews }))
        .sort((left, right) => left.slug.localeCompare(right.slug));
}
