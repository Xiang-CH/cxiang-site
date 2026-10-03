import { describe, expect, it } from "vitest";
import {
    GRID_COLUMNS,
    resolveLayout,
    MIN_CELL_H,
    MIN_CELL_W,
    applyMove,
    applyResize,
    clampRect,
    findFreeRect,
    layoutRowCount,
    pixelsToCells,
    rectsOverlap,
    resolveRect,
} from "./gallery-grid";

describe("rect clamping", () => {
    it("keeps a rect inside the grid", () => {
        expect(clampRect({ x: 10, y: 3, w: 6, h: 2 })).toEqual({ x: 6, y: 3, w: 6, h: 2 });
        expect(clampRect({ x: -4, y: -2, w: 4, h: 4 })).toEqual({ x: 0, y: 0, w: 4, h: 4 });
    });

    it("enforces a minimum size", () => {
        expect(clampRect({ x: 0, y: 0, w: 1, h: 1 })).toEqual({
            x: 0,
            y: 0,
            w: MIN_CELL_W,
            h: MIN_CELL_H,
        });
    });

    it("never lets a cell exceed the column count", () => {
        const rect = clampRect({ x: 0, y: 0, w: 99, h: 99 });
        expect(rect.w).toBe(GRID_COLUMNS);
    });
});

describe("legacy placement", () => {
    it("prefers explicit coordinates", () => {
        expect(resolveRect({ x: 3, y: 1, w: 5, h: 4, size: "tall" }, 0)).toEqual({
            x: 3,
            y: 1,
            w: 5,
            h: 4,
        });
    });

    it("falls back to the size preset", () => {
        expect(resolveRect({ size: "small" }, 0)).toEqual({ x: 0, y: 0, w: 6, h: 2 });
        expect(resolveRect({ size: "wide" }, 0)).toEqual({ x: 0, y: 0, w: GRID_COLUMNS, h: 3 });
        expect(resolveRect({ size: "tall" }, 0)).toEqual({ x: 0, y: 0, w: 6, h: 6 });
    });

    it("stacks a legacy collection without overlaps", () => {
        // Mixed preset heights are the reason a running cursor is used instead of
        // `index * height`, which would let a tall row overlap the next one.
        const rects = resolveLayout([{ size: "tall" }, { size: "small" }, { size: "wide" }]);

        expect(rects[0]).toEqual({ x: 0, y: 0, w: 6, h: 6 });
        expect(rects[1]).toEqual({ x: 0, y: 6, w: 6, h: 2 });
        expect(rects[2]).toEqual({ x: 0, y: 8, w: GRID_COLUMNS, h: 3 });

        for (let a = 0; a < rects.length; a++) {
            for (let b = a + 1; b < rects.length; b++) {
                expect(rectsOverlap(rects[a], rects[b])).toBe(false);
            }
        }
    });

    it("uses explicit coordinates when the whole collection has them", () => {
        expect(
            resolveLayout([
                { x: 0, y: 0, w: 6, h: 3 },
                { x: 6, y: 0, w: 6, h: 3 },
            ])
        ).toEqual([
            { x: 0, y: 0, w: 6, h: 3 },
            { x: 6, y: 0, w: 6, h: 3 },
        ]);
    });

    it("uses a sane default for an unknown preset", () => {
        expect(resolveRect({ size: "nonsense" }, 0)).toEqual({ x: 0, y: 0, w: 6, h: 4 });
        expect(resolveRect({}, 0)).toEqual({ x: 0, y: 0, w: 6, h: 4 });
    });

    it("treats partial coordinates as absent", () => {
        // x/y present but w/h missing must not slip through the coordinate path.
        expect(resolveRect({ x: 2, y: 2, size: "small" }, 0)).toEqual({ x: 0, y: 0, w: 6, h: 2 });
    });
});

describe("overlap detection", () => {
    it("detects intersecting rects", () => {
        expect(rectsOverlap({ x: 0, y: 0, w: 4, h: 4 }, { x: 2, y: 2, w: 4, h: 4 })).toBe(true);
    });

    it("treats touching edges as free", () => {
        expect(rectsOverlap({ x: 0, y: 0, w: 4, h: 4 }, { x: 4, y: 0, w: 4, h: 4 })).toBe(false);
        expect(rectsOverlap({ x: 0, y: 0, w: 4, h: 4 }, { x: 0, y: 4, w: 4, h: 4 })).toBe(false);
    });
});

describe("free slot search", () => {
    it("places the first cell at the origin", () => {
        expect(findFreeRect([], { x: 0, y: 0, w: 4, h: 3 })).toEqual({ x: 0, y: 0, w: 4, h: 3 });
    });

    it("fills the gap to the right of a narrower cell", () => {
        const placed = [{ x: 0, y: 0, w: 6, h: 3 }];
        expect(findFreeRect(placed, { x: 0, y: 0, w: 6, h: 3 })).toEqual({
            x: 6,
            y: 0,
            w: 6,
            h: 3,
        });
    });

    it("wraps to the next row when the current one is full", () => {
        const placed = [
            { x: 0, y: 0, w: 6, h: 3 },
            { x: 6, y: 0, w: 6, h: 3 },
        ];
        expect(findFreeRect(placed, { x: 0, y: 0, w: 6, h: 3 })).toEqual({
            x: 0,
            y: 3,
            w: 6,
            h: 3,
        });
    });

    it("does not leave a cell overlapping when a full-width cell blocks", () => {
        const placed = [{ x: 0, y: 0, w: GRID_COLUMNS, h: 2 }];
        const result = findFreeRect(placed, { x: 0, y: 0, w: 4, h: 3 });
        expect(rectsOverlap(result, placed[0])).toBe(false);
        expect(result.y).toBe(2);
    });
});

describe("drag maths", () => {
    const cellWidth = 80; // stepX = 92, stepY = 68

    it("converts pixels into cells", () => {
        expect(pixelsToCells({ dx: 0, dy: 0 }, cellWidth)).toEqual({ dx: 0, dy: 0 });
        expect(pixelsToCells({ dx: 100, dy: 70 }, cellWidth)).toEqual({ dx: 1, dy: 1 });
        expect(pixelsToCells({ dx: -95, dy: -140 }, cellWidth)).toEqual({ dx: -1, dy: -2 });
        // Sub-cell movement stays put, so a cell never shifts by accident.
        expect(pixelsToCells({ dx: 20, dy: 20 }, cellWidth)).toEqual({ dx: 0, dy: 0 });
    });

    it("moves without changing size, clamped to the grid", () => {
        const moved = applyMove({ x: 2, y: 1, w: 4, h: 3 }, { dx: 3, dy: 2 });
        expect(moved).toEqual({ x: 5, y: 3, w: 4, h: 3 });

        const clamped = applyMove({ x: 10, y: 0, w: 4, h: 3 }, { dx: 5, dy: 0 });
        expect(clamped.x).toBe(GRID_COLUMNS - 4);

        const negative = applyMove({ x: 1, y: 1, w: 4, h: 3 }, { dx: -9, dy: -9 });
        expect(negative).toMatchObject({ x: 0, y: 0 });
    });

    it("resizes from the origin, clamped to the grid", () => {
        expect(applyResize({ x: 2, y: 1, w: 4, h: 3 }, { dx: 2, dy: 1 })).toEqual({
            x: 2,
            y: 1,
            w: 6,
            h: 4,
        });

        // Cannot grow past the right edge.
        expect(applyResize({ x: 8, y: 0, w: 4, h: 3 }, { dx: 5, dy: 0 })).toEqual({
            x: 8,
            y: 0,
            w: 4,
            h: 3,
        });

        // Cannot shrink below the minimum.
        expect(applyResize({ x: 0, y: 0, w: 4, h: 4 }, { dx: -9, dy: -9 })).toEqual({
            x: 0,
            y: 0,
            w: MIN_CELL_W,
            h: MIN_CELL_H,
        });
    });
});

describe("row count", () => {
    it("leaves room below the content for dragging", () => {
        expect(layoutRowCount([])).toBe(6);
        expect(layoutRowCount([{ x: 0, y: 0, w: 4, h: 3 }])).toBe(6);
        expect(layoutRowCount([{ x: 0, y: 10, w: 4, h: 5 }])).toBe(16);
    });
});
