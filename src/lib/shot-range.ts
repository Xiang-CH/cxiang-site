/**
 * Display helpers for when a collection was shot.
 *
 * A collection can cover a single day or a span. These helpers are pure and
 * shared by the public pages and the Studio so the range reads the same
 * everywhere.
 */

const MONTH_YEAR: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
const MONTH_ONLY: Intl.DateTimeFormatOptions = { month: "short" };
const DAY_ONLY: Intl.DateTimeFormatOptions = { day: "numeric" };

type RangeInput = {
    /** Start of the shoot, or the only date. `YYYY-MM-DD`, or a `Date` from the driver. */
    shotOn?: string | Date | null;
    /** Optional end of the shoot, same shapes as `shotOn`. */
    shotOnEnd?: string | Date | null;
};

/**
 * Coerces a database date into `YYYY-MM-DD`.
 *
 * `pg` hands back `Date` objects for `date` columns rather than the plain
 * strings the Drizzle schema asks for, and those objects stringify into a full
 * timestamp. Every value is normalized here so the rest of these helpers — and
 * every string comparison — only ever sees a date string.
 */
export function toIsoDate(value: string | Date | null | undefined): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") {
        return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : undefined;
    }
    if (Number.isNaN(value.getTime())) return undefined;
    return value.toISOString().slice(0, 10);
}

function parseIsoDate(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    // Parsed as UTC so the rendered day never shifts with the server timezone.
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

function format(date: Date, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(date);
}

/**
 * Normalizes a possibly half-specified range.
 *
 * An end date without a start is treated as a single date, so a form left in
 * that state still renders something sensible instead of an empty range.
 */
export function normalizeShotRange(input: RangeInput): { start?: string; end?: string } {
    const start = toIsoDate(input.shotOn);
    const end = toIsoDate(input.shotOnEnd);

    if (!start && end) return { start: end, end: undefined };
    if (start && end && end === start) return { start, end: undefined };
    return { start, end };
}

/**
 * Renders a compact label for the shoot dates.
 *
 * - one date: `Mar 2025`
 * - within one month: `14–18 Mar 2025`
 * - within one year: `Mar–May 2025`
 * - across years: `Nov 2024 – Feb 2025`
 *
 * @returns The label, or `undefined` when there is no usable date.
 */
export function formatShotRange(input: RangeInput): string | undefined {
    const { start, end } = normalizeShotRange(input);

    const startDate = parseIsoDate(start);
    if (!startDate) return undefined;

    const endDate = parseIsoDate(end);
    if (!endDate) return format(startDate, MONTH_YEAR);

    const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
    const sameMonth = sameYear && startDate.getUTCMonth() === endDate.getUTCMonth();

    if (sameMonth) {
        return `${format(startDate, DAY_ONLY)}–${format(endDate, DAY_ONLY)} ${format(
            endDate,
            MONTH_YEAR
        )}`;
    }
    if (sameYear) {
        return `${format(startDate, MONTH_ONLY)}–${format(endDate, MONTH_YEAR)}`;
    }
    return `${format(startDate, MONTH_YEAR)} – ${format(endDate, MONTH_YEAR)}`;
}

/**
 * The month a collection is filed under, used for sorting and sitemap dates.
 *
 * @returns The first day of the start month as `YYYY-MM-01`, or `undefined`.
 */
export function getShotMonthStart(input: RangeInput): string | undefined {
    const { start } = normalizeShotRange(input);
    if (!start) return undefined;
    return `${start.slice(0, 7)}-01`;
}
