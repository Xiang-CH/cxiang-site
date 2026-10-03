import { z } from "zod";
import { PHOTO_SIZES, PHOTO_KIND, SPACER_KIND } from "@/lib/gallery-shared";

/**
 * Request/response shapes shared by the Studio client and the photoset API.
 *
 * Kept free of `server-only` so the drag-and-drop editor and the route handlers
 * validate against exactly the same contract.
 */

export const photoSizeSchema = z.enum([...PHOTO_SIZES]);

export const cellKindSchema = z.enum([PHOTO_KIND, SPACER_KIND]);

/**
 * A calendar date as `YYYY-MM-DD`.
 *
 * `z.iso.date()` rejects values a plain regex would accept (such as `2025-02-30`),
 * which would otherwise reach Postgres and surface as a 500 instead of a 400.
 */
export const shotDateSchema = z.iso.date().optional();

export const photosetPhotoInputSchema = z
    .object({
        /** Omitted for cells that do not exist yet; the server assigns the id. */
        id: z.string().max(36).optional(),
        /** `photo` (default) or `spacer`, which reserves blank space only. */
        kind: cellKindSchema.default(PHOTO_KIND),
        url: z.string().url().max(2000).optional(),
        storageKey: z.string().max(1000).optional(),
        alt: z.string().max(500).default(""),
        caption: z.string().max(500).optional(),
        width: z.number().int().positive().max(100000).optional(),
        height: z.number().int().positive().max(100000).optional(),
        /** Explicit grid rect supplied by the editor. */
        x: z.number().int().min(0).max(1000).optional(),
        y: z.number().int().min(0).max(10000).optional(),
        w: z.number().int().min(1).max(1000).optional(),
        h: z.number().int().min(1).max(10000).optional(),
        /** Legacy preset, retained for compatibility. */
        size: photoSizeSchema.default("medium"),
    })
    .superRefine((cell, ctx) => {
        // A spacer has no image, so the image fields are required only for photos.
        if (cell.kind !== PHOTO_KIND) return;
        if (!cell.url) {
            ctx.addIssue({ code: "custom", message: "A photo needs an image URL." });
        }
        if (!cell.width || !cell.height) {
            ctx.addIssue({ code: "custom", message: "A photo needs its pixel dimensions." });
        }
    });

export const photosetInputSchema = z.object({
    title: z.string().min(1).max(255),
    slug: z
        .string()
        .min(1)
        .max(255)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
    abstract: z.string().max(2000).optional(),
    /** Start of the shoot, or the only shoot date. */
    shotOn: shotDateSchema,
    /** Optional end of the shoot when the collection spans a range. */
    shotOnEnd: shotDateSchema,
    published: z.boolean().default(false),
    /**
     * Preferred cover, referenced by photo id. Ignored when the photo is brand
     * new and has no id yet.
     */
    coverPhotoId: z.string().max(36).optional(),
    /**
     * Fallback cover reference for photos created by this same request: the
     * server resolves the index to the id it just generated.
     */
    coverIndex: z.number().int().min(0).optional(),
    /** Photos in display order; array position becomes each photo's `sortOrder`. */
    photos: z.array(photosetPhotoInputSchema).max(500),
});

/**
 * Rejects a range that ends before it starts.
 *
 * Checked separately from the field schema so the message can name the actual
 * problem rather than a generic shape error.
 *
 * @returns An error message, or `null` when the range is usable.
 */
export function validateShotRange(input: { shotOn?: string; shotOnEnd?: string }): string | null {
    if (!input.shotOnEnd) return null;
    if (!input.shotOn) return "Set a start date before an end date.";
    if (input.shotOnEnd < input.shotOn) return "The end date cannot be before the start date.";
    return null;
}

export type PhotoSetInput = z.infer<typeof photosetInputSchema>;
export type PhotoSetPhotoInput = z.infer<typeof photosetPhotoInputSchema>;

/** Editor-facing photoset shape, including unpublished drafts. */
export type StudioPhotoSet = PhotoSetInput & {
    id: string;
    updatedAt: string;
};

export type UploadTicket = {
    uploadUrl: string;
    /** Public CDN URL to store against the photo once the upload succeeds. */
    publicUrl: string;
    storageKey: string;
};
