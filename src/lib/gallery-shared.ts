/**
 * Types shared by the photo gallery's server fetchers and its client island.
 * Lives outside `lib/photos.ts` so components can import it without pulling in
 * `server-only`.
 */

/**
 * Legacy footprint preset.
 *
 * Kept because collections authored before free-form placement store a preset
 * instead of coordinates; `lib/gallery-grid.ts` converts it into a rect on read.
 */
export type PhotoSize = "small" | "medium" | "large" | "wide" | "tall";

export const PHOTO_SIZES: readonly PhotoSize[] = ["small", "medium", "large", "wide", "tall"];

export const PHOTO_KIND = "photo";
export const SPACER_KIND = "spacer";

/** A cell in the layout grid: either a photograph or an explicit blank spacer. */
export type GalleryCell = {
    id: string;
    /** Public CDN URL. Empty for spacers. */
    src: string;
    alt: string;
    caption?: string;
    /** Intrinsic pixel size, used for the image element. */
    width: number;
    height: number;
    /** `photo` or `spacer`. */
    kind: string;
    /** Explicit grid rect; null on rows written before free-form placement. */
    x: number | null;
    y: number | null;
    w: number | null;
    h: number | null;
    /** Legacy preset, only used when the rect is null. */
    size: PhotoSize;
    sortOrder: number;
};

/** True when the cell carries no image and only reserves blank space. */
export function isSpacer(cell: Pick<GalleryCell, "kind">): boolean {
    return cell.kind === SPACER_KIND;
}
