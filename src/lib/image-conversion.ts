/**
 * Client-side WebP encoding for the Studio.
 *
 * Photos are uploaded straight from the browser to the bucket, so the server
 * never sees the bytes and cannot compress them. Encoding happens here instead,
 * which also means less data leaves the user's machine.
 *
 * This module is deliberately free of DOM access at import time so the decision
 * logic stays unit-testable; the browser APIs are only touched when encoding.
 */

/** Quality used when the caller does not pick one (roughly visually lossless for photos). */
export const DEFAULT_WEBP_QUALITY = 82;

export const MIN_WEBP_QUALITY = 60;
export const MAX_WEBP_QUALITY = 95;

export type EncodeResult = {
    /** What should actually be uploaded. */
    file: File;
    /** True when the bytes were re-encoded (false means the original was kept). */
    converted: boolean;
    /** True when the browser cannot produce WebP and the original was uploaded. */
    fallback: boolean;
    width: number;
    height: number;
    /** Byte size before encoding. */
    originalBytes: number;
    /** Byte size of what will be uploaded. */
    bytes: number;
};

/** Replaces the extension with `.webp`. */
export function webpFilename(filename: string): string {
    const dot = filename.lastIndexOf(".");
    const base = dot > 0 ? filename.slice(0, dot) : filename;
    return `${base}.webp`;
}

/**
 * Whether a file should be re-encoded.
 *
 * WebP is skipped so an already-encoded upload never loses another generation of
 * quality, and non-images are left alone.
 */
export function shouldEncodeToWebp(file: File, force = false): boolean {
    if (force) return true;
    if (!file.type.startsWith("image/")) return false;
    return file.type !== "image/webp";
}

function clampQuality(quality: number): number {
    if (!Number.isFinite(quality)) return DEFAULT_WEBP_QUALITY;
    return Math.min(MAX_WEBP_QUALITY, Math.max(MIN_WEBP_QUALITY, Math.round(quality)));
}

async function loadImage(file: File): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("That file could not be read as an image."));
            image.src = url;
        });
        return image;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
    return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), type, quality);
    });
}

/**
 * Re-encodes an image as WebP, preserving its dimensions.
 *
 * Falls back to the untouched original when the browser cannot encode WebP or
 * when the result would not actually be smaller.
 *
 * @param file - The file the user picked.
 * @param options.quality - WebP quality (clamped to 60–95).
 * @param options.force - Encode even when the source is already WebP.
 */
export async function encodeToWebp(
    file: File,
    options: { quality?: number; force?: boolean } = {}
): Promise<EncodeResult> {
    const originalBytes = file.size;
    const quality = clampQuality(options.quality ?? DEFAULT_WEBP_QUALITY);

    const image = await loadImage(file);
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    const keepOriginal = (fallback: boolean): EncodeResult => ({
        file,
        converted: false,
        fallback,
        width,
        height,
        originalBytes,
        bytes: originalBytes,
    });

    if (width === 0 || height === 0) return keepOriginal(false);
    if (!shouldEncodeToWebp(file, options.force)) return keepOriginal(false);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return keepOriginal(true);

    context.drawImage(image, 0, 0, width, height);

    let blob = await canvasToBlob(canvas, "image/webp", quality / 100);
    if (!blob || blob.type !== "image/webp") {
        // Some engines silently fall back to PNG for `toBlob`, which would make
        // the upload bigger; try a stricter quality before giving up.
        blob = await canvasToBlob(canvas, "image/webp", 0.8);
    }
    if (!blob || blob.type !== "image/webp") return keepOriginal(true);
    if (blob.size >= originalBytes) return keepOriginal(false);

    const convertedFile = new File([blob], webpFilename(file.name), {
        type: "image/webp",
        lastModified: Date.now(),
    });

    return {
        file: convertedFile,
        converted: true,
        fallback: false,
        width,
        height,
        originalBytes,
        bytes: convertedFile.size,
    };
}

/** Formats a byte count for the upload summary. */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
