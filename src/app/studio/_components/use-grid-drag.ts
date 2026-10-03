"use client";

import { useCallback, useRef, useState } from "react";
import { GRID_GAP, applyMove, applyResize, pixelsToCells, type GridRect } from "@/lib/gallery-grid";

/**
 * Pointer drag + resize for the Studio canvas.
 *
 * Pointer events are captured on the handle so a drag keeps tracking outside the
 * element, and movements are converted to whole grid cells so a cell always lands
 * on the grid. Nothing is committed until the pointer is released, which keeps a
 * drag to a single state update.
 */

type DragMode = "move" | "resize";

export type DragState = {
    id: string;
    mode: DragMode;
    origin: GridRect;
    current: GridRect;
};

export function useGridDrag({
    cellWidth,
    onCommit,
}: {
    /** Width of one column in pixels, needed to convert movement into cells. */
    cellWidth: number;
    onCommit: (id: string, rect: GridRect) => void;
}) {
    const [drag, setDrag] = useState<DragState | null>(null);
    const startRef = useRef<{ x: number; y: number } | null>(null);

    const begin = useCallback(
        (event: React.PointerEvent, id: string, mode: DragMode, origin: GridRect) => {
            // Ignore secondary buttons and let the handle keep receiving moves.
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);

            startRef.current = { x: event.clientX, y: event.clientY };
            setDrag({ id, mode, origin, current: origin });
        },
        []
    );

    const move = useCallback(
        (event: React.PointerEvent) => {
            if (!drag || !startRef.current) return;
            const delta = pixelsToCells(
                {
                    dx: event.clientX - startRef.current.x,
                    dy: event.clientY - startRef.current.y,
                },
                cellWidth
            );

            const next =
                drag.mode === "move"
                    ? applyMove(drag.origin, delta)
                    : applyResize(drag.origin, delta);

            setDrag((current) => (current ? { ...current, current: next } : current));
        },
        [drag, cellWidth]
    );

    const end = useCallback(
        (event: React.PointerEvent) => {
            if (!drag) return;
            (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
            startRef.current = null;
            const finished = drag.current;
            setDrag(null);
            if (
                finished.x !== drag.origin.x ||
                finished.y !== drag.origin.y ||
                finished.w !== drag.origin.w ||
                finished.h !== drag.origin.h
            ) {
                onCommit(drag.id, finished);
            }
        },
        [drag, onCommit]
    );

    /** The rect to draw for a cell while it is being dragged. */
    const rectFor = useCallback(
        (id: string, fallback: GridRect): GridRect => (drag?.id === id ? drag.current : fallback),
        [drag]
    );

    return { drag, begin, move, end, rectFor };
}

/** Pixel geometry for the canvas, derived from the measured container width. */
export function gridMetrics(containerWidth: number) {
    const cellWidth = (containerWidth - GRID_GAP * (12 - 1)) / 12;
    return { cellWidth, gap: GRID_GAP };
}
