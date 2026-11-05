import { describe, expect, it } from "vitest";
import { formatShotRange, getShotMonthStart, normalizeShotRange, toIsoDate } from "./shot-range";

describe("shot range normalization", () => {
    it("keeps an explicit range", () => {
        expect(normalizeShotRange({ shotOn: "2025-03-14", shotOnEnd: "2025-05-02" })).toEqual({
            start: "2025-03-14",
            end: "2025-05-02",
        });
    });

    it("drops an end that equals the start", () => {
        expect(normalizeShotRange({ shotOn: "2025-03-14", shotOnEnd: "2025-03-14" })).toEqual({
            start: "2025-03-14",
            end: undefined,
        });
    });

    it("treats an end without a start as a single date", () => {
        expect(normalizeShotRange({ shotOnEnd: "2025-03-14" })).toEqual({
            start: "2025-03-14",
            end: undefined,
        });
    });

    it("returns nothing when both are empty", () => {
        expect(normalizeShotRange({})).toEqual({ start: undefined, end: undefined });
        expect(normalizeShotRange({ shotOn: "", shotOnEnd: "" })).toEqual({
            start: undefined,
            end: undefined,
        });
    });
});

describe("shot range labels", () => {
    it("renders a single month and year for one date", () => {
        expect(formatShotRange({ shotOn: "2025-03-14" })).toBe("Mar 2025");
    });

    it("collapses a range inside one month to days", () => {
        expect(formatShotRange({ shotOn: "2025-03-14", shotOnEnd: "2025-03-18" })).toBe(
            "14–18 Mar 2025"
        );
    });

    it("collapses a range inside one year to months", () => {
        expect(formatShotRange({ shotOn: "2025-03-14", shotOnEnd: "2025-05-02" })).toBe(
            "Mar–May 2025"
        );
    });

    it("keeps both years when the range crosses one", () => {
        expect(formatShotRange({ shotOn: "2024-11-02", shotOnEnd: "2025-02-20" })).toBe(
            "Nov 2024 – Feb 2025"
        );
    });

    it("ignores an unparseable date", () => {
        expect(formatShotRange({ shotOn: "not-a-date" })).toBeUndefined();
        expect(formatShotRange({})).toBeUndefined();
    });

    it("does not shift the day with the server timezone", () => {
        // Parsed as UTC, so the first of the month must not roll back a day.
        expect(formatShotRange({ shotOn: "2025-01-01", shotOnEnd: "2025-01-03" })).toBe(
            "1–3 Jan 2025"
        );
    });
});

describe("shot month start", () => {
    it("files a single date under its month", () => {
        expect(getShotMonthStart({ shotOn: "2025-03-14" })).toBe("2025-03-01");
    });

    it("files a range under the month it started", () => {
        expect(getShotMonthStart({ shotOn: "2024-11-02", shotOnEnd: "2025-02-20" })).toBe(
            "2024-11-01"
        );
    });

    it("is undefined without a usable date", () => {
        expect(getShotMonthStart({})).toBeUndefined();
    });
});

describe("driver date coercion", () => {
    it("converts a Date from the database into a plain date string", () => {
        // `pg` returns Date objects for `date` columns; the surrounding helpers
        // only work if these are normalized first.
        expect(toIsoDate(new Date("2024-11-02T00:00:00Z"))).toBe("2024-11-02");
        expect(toIsoDate(new Date("2025-02-20T00:00:00Z"))).toBe("2025-02-20");
    });

    it("truncates a full timestamp to its date", () => {
        expect(toIsoDate("2025-02-20T00:00:00.000Z")).toBe("2025-02-20");
        expect(toIsoDate("2025-02-20")).toBe("2025-02-20");
    });

    it("returns undefined for empty or invalid input", () => {
        expect(toIsoDate(null)).toBeUndefined();
        expect(toIsoDate(undefined)).toBeUndefined();
        expect(toIsoDate("")).toBeUndefined();
        expect(toIsoDate(new Date("nope"))).toBeUndefined();
        expect(toIsoDate("not-a-date")).toBeUndefined();
    });

    it("formats a range whose bounds arrive as Date objects", () => {
        // The regression this guards: both bounds are Dates, and comparing them
        // as objects previously collapsed the range to a single month.
        expect(
            formatShotRange({
                shotOn: new Date("2024-11-02T00:00:00Z"),
                shotOnEnd: new Date("2025-02-20T00:00:00Z"),
            })
        ).toBe("Nov 2024 – Feb 2025");
    });

    it("files a Date-based range under its start month", () => {
        expect(getShotMonthStart({ shotOn: new Date("2024-11-02T00:00:00Z") })).toBe("2024-11-01");
    });
});
