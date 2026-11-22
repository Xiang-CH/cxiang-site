import { describe, expect, it } from "vitest";
import {
    DEFAULT_PHOTO_PREFIX,
    assertSafeStorageKey,
    buildStorageKey,
    normalizePhotoPrefix,
} from "./cdn-storage-keys";

describe("photo object key naming", () => {
    it("builds a prefixed, timestamped, slugified key", () => {
        const key = buildStorageKey("Sunset Over The Bay.JPG", 1790958730317);
        expect(key).toBe("photos/1790958730317-sunset-over-the-bay.jpg");
    });

    it("strips diacritics and collapses punctuation in the readable part", () => {
        const key = buildStorageKey("  Été — à la mer (2025)!.png", 1);
        expect(key).toBe("photos/1-ete-a-la-mer-2025.png");
    });

    it("falls back to a generic name when the filename has nothing usable", () => {
        const key = buildStorageKey("!!!.jpg", 42);
        expect(key).toBe("photos/42-photo.jpg");
    });

    it("stores unexpected extensions as jpg rather than trusting the name", () => {
        expect(buildStorageKey("payload.svg", 42)).toBe("photos/42-payload.jpg");
        expect(buildStorageKey("script.php", 42)).toBe("photos/42-script.jpg");
        expect(buildStorageKey("noextension", 42)).toBe("photos/42-noextension.jpg");
    });

    it("keeps the timestamp so a re-upload never overwrites a cached URL", () => {
        const first = buildStorageKey("shot.jpg", 1000);
        const second = buildStorageKey("shot.jpg", 2000);
        expect(first).not.toBe(second);
    });

    it("honors a custom prefix", () => {
        expect(buildStorageKey("shot.webp", 7, "gallery")).toBe("gallery/7-shot.webp");
    });
});

describe("photo object key validation", () => {
    it("accepts a key produced by buildStorageKey", () => {
        const key = buildStorageKey("Sunset Over The Bay.JPG", 1790958730317);
        expect(assertSafeStorageKey(key)).toBe(key);
    });

    it("refuses keys outside the photo prefix", () => {
        expect(assertSafeStorageKey("resume_chen_xiang.pdf")).toBeNull();
        expect(assertSafeStorageKey("photos-other/1-a.jpg")).toBeNull();
        expect(assertSafeStorageKey("other/1-a.jpg")).toBeNull();
        expect(assertSafeStorageKey("photos")).toBeNull();
    });

    it("refuses path traversal", () => {
        expect(assertSafeStorageKey("photos/../secrets.txt")).toBeNull();
        expect(assertSafeStorageKey("photos/..%2fsecrets.txt")).toBeNull();
        expect(assertSafeStorageKey("photos/a/../../b.jpg")).toBeNull();
    });

    it("refuses characters that are not part of a generated key", () => {
        expect(assertSafeStorageKey("photos/a b.jpg")).toBeNull();
        expect(assertSafeStorageKey("photos/a?x=1")).toBeNull();
        expect(assertSafeStorageKey("photos/a#frag")).toBeNull();
        expect(assertSafeStorageKey("photos/a+b.jpg")).toBeNull();
    });

    it("refuses an empty key", () => {
        expect(assertSafeStorageKey("")).toBeNull();
    });

    it("respects a custom prefix", () => {
        expect(assertSafeStorageKey("gallery/1-a.jpg", "gallery")).toBe("gallery/1-a.jpg");
        expect(assertSafeStorageKey("photos/1-a.jpg", "gallery")).toBeNull();
    });
});

describe("photo prefix normalization", () => {
    it("defaults when unset or blank", () => {
        expect(normalizePhotoPrefix(undefined)).toBe(DEFAULT_PHOTO_PREFIX);
        expect(normalizePhotoPrefix("")).toBe(DEFAULT_PHOTO_PREFIX);
        expect(normalizePhotoPrefix("   ")).toBe(DEFAULT_PHOTO_PREFIX);
    });

    it("trims surrounding slashes and whitespace", () => {
        expect(normalizePhotoPrefix("/gallery/")).toBe("gallery");
        expect(normalizePhotoPrefix("  media/photos ")).toBe("media/photos");
    });
});
