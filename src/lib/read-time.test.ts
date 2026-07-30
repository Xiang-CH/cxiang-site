import { describe, expect, it } from "vitest";
import { estimateReadTimeMinutes } from "./read-time";

describe("estimateReadTimeMinutes", () => {
    it("uses a one-minute minimum for short posts", () => {
        expect(estimateReadTimeMinutes("A short post.")).toBe(1);
    });

    it("estimates English prose at 200 words per minute", () => {
        expect(estimateReadTimeMinutes(Array(401).fill("word").join(" "))).toBe(3);
    });

    it("supports character-based languages", () => {
        expect(estimateReadTimeMinutes("你".repeat(501))).toBe(2);
    });
});
