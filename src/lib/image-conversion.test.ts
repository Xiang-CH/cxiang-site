import { describe, expect, it } from "vitest";
import {
    DEFAULT_WEBP_QUALITY,
    isAnimatedPng,
    MAX_WEBP_QUALITY,
    MIN_WEBP_QUALITY,
    formatBytes,
    shouldEncodeToWebp,
    webpFilename,
} from "./image-conversion";

const fileOf = (name: string, type: string, size = 1000) =>
    new File([new Uint8Array(size)], name, { type });

/** Builds a minimal PNG, optionally carrying the APNG animation control chunk. */
function pngFile(name: string, { animated }: { animated: boolean }): File {
    const chunk = (tag: string, data: Uint8Array) => {
        const length = new Uint8Array(4);
        new DataView(length.buffer).setUint32(0, data.length);
        const type = new TextEncoder().encode(tag);
        const body = new Uint8Array([...type, ...data]);
        // CRC is not validated by the detector, so a placeholder is fine here.
        return new Uint8Array([...length, ...body, 0, 0, 0, 0]);
    };
    const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdr = chunk("IHDR", new Uint8Array(13));
    // `acTL` present => APNG; absent => a still PNG.
    const actl = animated ? chunk("acTL", new Uint8Array(8)) : new Uint8Array();
    const idat = chunk("IDAT", new Uint8Array(16));
    const iend = chunk("IEND", new Uint8Array(0));
    return new File([signature, ihdr, actl, idat, iend], name, { type: "image/png" });
}

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

    it("skips animated formats so they keep animating", () => {
        // A canvas keeps only the first frame, so encoding these would silently
        // flatten an animated upload into a still image.
        expect(shouldEncodeToWebp(fileOf("a.gif", "image/gif"))).toBe(false);
        expect(shouldEncodeToWebp(fileOf("a.apng", "image/apng"))).toBe(false);
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

describe("animated PNG detection", () => {
    it("detects an APNG that arrives typed as image/png", async () => {
        // The MIME type cannot distinguish these, so the chunk is inspected.
        expect(await isAnimatedPng(pngFile("anim.png", { animated: true }))).toBe(true);
    });

    it("leaves a still PNG alone", async () => {
        expect(await isAnimatedPng(pngFile("still.png", { animated: false }))).toBe(false);
    });

    it("ignores non-PNG types", async () => {
        expect(await isAnimatedPng(fileOf("a.jpg", "image/jpeg"))).toBe(false);
        expect(await isAnimatedPng(fileOf("a.gif", "image/gif"))).toBe(false);
    });
});
