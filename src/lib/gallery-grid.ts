/**
 * Free-form placement geometry for photo collections.
 *
 * Layout is a fixed 12-column grid with uniform row heights. Each cell occupies
 * whole cells: `x`/`y` is its origin and `w`/`h` its size. Nothing is auto-packed,
 * so any cell no one occupies is simply blank — that is how whitespace is
 * expressed, and a `spacer` cell is just an explicit blank block.
 *
 * This module is pure and shared by the Studio editor and the public renderer so
 * both agree on what a stored row means.
 */

/** Columns in the layout grid. Twelve divides evenly by 2, 3, 4 and 6. */
export const GRID_COLUMNS = 12;

/** Row height in pixels, used to turn a cell rect into a pixel rect for dragging. */
export const GRID_ROW_HEIGHT = 56;

/** Gap between cells in pixels. Mirrored by the `gap-*` classes in the renderer. */
export const GRID_GAP = 12;

/** Smallest sensible cell, in grid units. */
export const MIN_CELL_W = 2;
export const MIN_CELL_H = 2;

export const SPACER_KIND = "spacer";
export const PHOTO_KIND = "photo";

export type CellKind = typeof PHOTO_KIND | typeof SPACER_KIND;

/** A rect on the layout grid, in cells. */
export type GridRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};

/**
 * Placement as stored: coordinates may be absent on rows written before
 * free-form placement existed, in which case the legacy `size` preset is used.
 */
export type StoredPlacement = {
    x?: number | null;
    y?: number | null;
    w?: number | null;
    h?: number | null;
    /** Legacy preset, only consulted when coordinates are missing. */
    size?: string | null;
};

/** Footprint the legacy size presets map onto. */
const LEGACY_SIZE_RECTS: Record<string, Pick<GridRect, "w" | "h">> = {
    small: { w: 6, h: 2 },
    medium: { w: 6, h: 4 },
    large: { w: 12, h: 5 },
    wide: { w: 12, h: 3 },
    tall: { w: 6, h: 6 },
};

const DEFAULT_RECT: Pick<GridRect, "w" | "h"> = LEGACY_SIZE_RECTS.medium;

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/** Clamps a rect so it always sits inside the grid and keeps a usable size. */
export function clampRect(rect: GridRect): GridRect {
    const w = clamp(Math.round(rect.w), MIN_CELL_W, GRID_COLUMNS);
    const h = Math.max(MIN_CELL_H, Math.round(rect.h));
    const x = clamp(Math.round(rect.x), 0, GRID_COLUMNS - w);
    const y = Math.max(0, Math.round(rect.y));
    return { x, y, w, h };
}

function hasCoordinates(placement: StoredPlacement): boolean {
    return (
        typeof placement.x === "number" &&
        typeof placement.y === "number" &&
        typeof placement.w === "number" &&
        typeof placement.h === "number"
    );
}

/**
 * Resolves a stored row to an explicit rect.
 *
 * Prefer {@link resolveLayout} when resolving a whole collection: a legacy row's
 * position depends on the rows before it.
 *
 * @param placement - Coordinates, or a legacy `size` preset.
 * @param index - Position in the collection, used only as a crude stacking hint.
 */
export function resolveRect(placement: StoredPlacement, index: number): GridRect {
    if (hasCoordinates(placement)) {
        return clampRect({
            x: placement.x as number,
            y: placement.y as number,
            w: placement.w as number,
            h: placement.h as number,
        });
    }
    // Only correct when every preceding row shares this preset's height; the
    // collection-level helper avoids that assumption.
    const footprint = legacyFootprint(placement.size);
    return clampRect({ x: 0, y: index * footprint.h, ...footprint });
}

/**
 * Resolves a whole collection to explicit rects.
 *
 * Explicit coordinates are used as-is; legacy rows are stacked with a running
 * cursor so a tall row can never overlap the next one.
 */
export function resolveLayout(
    placements: Array<StoredPlacement & { kind?: string | null }>
): GridRect[] {
    if (placements.every(hasCoordinates)) {
        return placements.map((placement) =>
            clampRect({
                x: placement.x as number,
                y: placement.y as number,
                w: placement.w as number,
                h: placement.h as number,
            })
        );
    }

    let cursor = 0;
    return placements.map((placement) => {
        if (hasCoordinates(placement)) {
            return clampRect({
                x: placement.x as number,
                y: placement.y as number,
                w: placement.w as number,
                h: placement.h as number,
            });
        }
        const footprint = legacyFootprint(placement.size);
        const rect = clampRect({ x: 0, y: cursor, ...footprint });
        cursor = rect.y + rect.h;
        return rect;
    });
}

/** Footprint a legacy row contributes. */
export function legacyFootprint(size: string | null | undefined): { w: number; h: number } {
    return LEGACY_SIZE_RECTS[size ?? ""] ?? DEFAULT_RECT;
}

/**
 * Places a new cell in the first free slot scanning left to right, top to bottom.
 *
 * Used as the default position for freshly uploaded photos and for converting a
 * preset-based collection into explicit coordinates.
 */
export function findFreeRect(existing: GridRect[], size: GridRect): GridRect {
    const target = clampRect(size);

    // Rows are scanned up to one full column below everything already placed, so
    // a sparse layout cannot push a new cell absurdly far down.
    const maxY = existing.reduce((max, rect) => Math.max(max, rect.y + rect.h), 0) + 1;

    for (let y = 0; y <= maxY; y++) {
        for (let x = 0; x + target.w <= GRID_COLUMNS; x++) {
            const candidate = { x, y, w: target.w, h: target.h };
            if (!existing.some((rect) => rectsOverlap(rect, candidate))) return candidate;
        }
    }

    // Unreachable in practice, but keeps the return type honest.
    return { x: 0, y: maxY, w: target.w, h: target.h };
}

export function rectsOverlap(a: GridRect, b: GridRect): boolean {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Total rows a layout occupies, used to size the editor canvas. */
export function layoutRowCount(rects: GridRect[], minimum = 6): number {
    return Math.max(minimum, rects.reduce((max, rect) => Math.max(max, rect.y + rect.h), 0) + 1);
}

/**
 * Converts a pointer delta in pixels into whole grid cells.
 *
 * @param delta - Movement in pixels.
 * @param cellWidth - Width of one column in pixels.
 */
export function pixelsToCells(
    delta: { dx: number; dy: number },
    cellWidth: number
): { dx: number; dy: number } {
    const stepX = cellWidth + GRID_GAP;
    const stepY = GRID_ROW_HEIGHT + GRID_GAP;
    return {
        dx: Math.round(delta.dx / stepX),
        dy: Math.round(delta.dy / stepY),
    };
}

/**
 * Applies a move drag to a rect, clamped so it cannot leave the grid.
 *
 * @param origin - The rect when the drag started.
 * @param delta - Movement in whole cells.
 */
export function applyMove(origin: GridRect, delta: { dx: number; dy: number }): GridRect {
    return clampRect({ ...origin, x: origin.x + delta.dx, y: origin.y + delta.dy });
}

/**
 * Applies a resize drag to the bottom-right handle.
 *
 * Width and height are capped by the space actually available from the cell's
 * origin — resizing must never slide the cell instead of stopping at the edge.
 *
 * @param origin - The rect when the drag started.
 * @param delta - Movement in whole cells.
 */
export function applyResize(origin: GridRect, delta: { dx: number; dy: number }): GridRect {
    const x = clamp(Math.round(origin.x), 0, GRID_COLUMNS - MIN_CELL_W);
    const y = Math.max(0, Math.round(origin.y));
    const maxW = GRID_COLUMNS - x;
    const w = clamp(Math.round(origin.w) + delta.dx, MIN_CELL_W, maxW);
    const h = Math.max(MIN_CELL_H, Math.round(origin.h) + delta.dy);
    return { x, y, w, h };
}

/** Builds a blank cell of the given footprint. */
export function makeSpacer(size: { w: number; h: number } = { w: 4, h: 3 }): GridRect {
    return clampRect({ x: 0, y: 0, w: size.w, h: size.h });
}
