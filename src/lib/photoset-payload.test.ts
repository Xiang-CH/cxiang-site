import { describe, expect, it } from "vitest";
import { photosetInputSchema, validateShotRange } from "./photoset-payload";

const base = { title: "Set", slug: "set", published: false, photos: [] };

describe("photoset payload shot range", () => {
    it("accepts a single date", () => {
        const parsed = photosetInputSchema.safeParse({ ...base, shotOn: "2025-03-14" });
        expect(parsed.success).toBe(true);
        expect(validateShotRange(parsed.data ?? {})).toBeNull();
    });

    it("accepts an ordered range", () => {
        const parsed = photosetInputSchema.safeParse({
            ...base,
            shotOn: "2025-03-14",
            shotOnEnd: "2025-05-02",
        });
        expect(parsed.success).toBe(true);
        expect(validateShotRange(parsed.data ?? {})).toBeNull();
    });

    it("accepts an equal start and end", () => {
        expect(validateShotRange({ shotOn: "2025-03-14", shotOnEnd: "2025-03-14" })).toBeNull();
    });

    it("rejects an end before the start", () => {
        expect(validateShotRange({ shotOn: "2025-05-02", shotOnEnd: "2025-03-14" })).toBe(
            "The end date cannot be before the start date."
        );
    });

    it("rejects an end without a start", () => {
        expect(validateShotRange({ shotOnEnd: "2025-03-14" })).toBe(
            "Set a start date before an end date."
        );
    });

    it("rejects malformed dates at the schema level", () => {
        expect(photosetInputSchema.safeParse({ ...base, shotOnEnd: "14/03/2025" }).success).toBe(
            false
        );
        expect(photosetInputSchema.safeParse({ ...base, shotOn: "2025-3-4" }).success).toBe(false);
    });
});
