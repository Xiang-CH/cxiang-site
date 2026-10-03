import { describe, expect, it } from "vitest";
import {
    DEFAULT_WEBP_QUALITY,
    MAX_WEBP_QUALITY,
    MIN_WEBP_QUALITY,
    formatBytes,
    shouldEncodeToWebp,
    webpFilename,
} from "./image-conversion";

const fileOf = (name: string, type: string, size = 1000) =>
    new File([new Uint8Array(size)], name, { type });

describe("webp filename", () => {
    it("swaps the extension", () => {
        expect(webpFilename("IMG_0348.HEIC")).toBe("IMG_0348.webp");
        expect(webpFilename("sunset over the bay.jpg")).toBe("sunset over the bay.webp");
        expect(webpFilename("a.b.c.png")).toBe("a.b.c.webp");
    });

    it("appends when there is no extension", () => {
        expect(webpFilename("photo")).toBe("photo.webp");
    });

    it("keeps a leading dot intact", () => {
        expect(webpFilename(".hidden")).toBe(".hidden.webp");
    });
});

describe("encode decision", () => {
    it("encodes ordinary photos", () => {
        expect(shouldEncodeToWebp(fileOf("a.jpg", "image/jpeg"))).toBe(true);
        expect(shouldEncodeToWebp(fileOf("a.png", "image/png"))).toBe(true);
        expect(shouldEncodeToWebp(fileOf("a.heic", "image/heic"))).toBe(true);
    });

    it("skips files that are already WebP", () => {
        // Re-encoding would cost another generation of quality for little gain.
        expect(shouldEncodeToWebp(fileOf("a.webp", "image/webp"))).toBe(false);
    });

    it("skips anything that is not an image", () => {
        expect(shouldEncodeToWebp(fileOf("a.pdf", "application/pdf"))).toBe(false);
        expect(shouldEncodeToWebp(fileOf("a.txt", "text/plain"))).toBe(false);
    });

    it("honours an explicit override", () => {
        expect(shouldEncodeToWebp(fileOf("a.webp", "image/webp"), true)).toBe(true);
    });
});

describe("quality bounds", () => {
    it("exposes sane defaults and limits", () => {
        expect(MIN_WEBP_QUALITY).toBeLessThan(DEFAULT_WEBP_QUALITY);
        expect(MAX_WEBP_QUALITY).toBeGreaterThan(DEFAULT_WEBP_QUALITY);
        expect(DEFAULT_WEBP_QUALITY).toBeGreaterThanOrEqual(MIN_WEBP_QUALITY);
        expect(DEFAULT_WEBP_QUALITY).toBeLessThanOrEqual(MAX_WEBP_QUALITY);
    });
});

describe("byte formatting", () => {
    it("scales the unit", () => {
        expect(formatBytes(512)).toBe("512 B");
        expect(formatBytes(2048)).toBe("2 KB");
        expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    });
});
