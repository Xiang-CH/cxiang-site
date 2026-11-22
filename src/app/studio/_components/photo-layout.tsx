import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react";
import { ChevronDown, ChevronUp, Maximize2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    GRID_COLUMNS,
    GRID_GAP,
    GRID_ROW_HEIGHT,
    applyResize,
    clampRect,
    photoAspectRows,
    type GridRect,
} from "@/lib/gallery-grid";
import { SPACER_KIND } from "@/lib/gallery-shared";
import type { PhotoSetPhotoInput } from "@/lib/photoset-payload";
import { useGridDrag } from "./use-grid-drag";

export type EditorItem = PhotoSetPhotoInput & {
    /** Stable React key; equals the photo id once saved, otherwise a local key. */
    key: string;
    width: number;
    height: number;
};

type PhotoLayoutProps = {
    disabled: boolean;
    items: EditorItem[];
    setItems: Dispatch<SetStateAction<EditorItem[]>>;
    coverKey: string | null;
    setCoverKey: (key: string) => void;
    remove: (key: string) => void;
    zoom: number;
    showGrid: boolean;
};

export function PhotoLayout({
    disabled,
    items,
    setItems,
    coverKey,
    setCoverKey,
    remove,
    zoom,
    showGrid,
}: PhotoLayoutProps) {
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const selectedIndex = Math.max(
        0,
        items.findIndex((item) => item.key === selectedKey)
    );
    const selectedItem = items[selectedIndex];
    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasWidth, setCanvasWidth] = useState(720);

    useEffect(() => {
        const element = canvasRef.current;
        if (!element) return;
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width;
            if (width) setCanvasWidth(width);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // One column width, with the inter-column gaps removed from the total. The
    // same value feeds the drag maths, so a dragged cell tracks the pointer and
    // the canvas matches the public renderer's `gap`-based grid.
    const cellWidth = Math.max(1, (canvasWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

    const commitRect = useCallback(
        (key: string, rect: GridRect) => {
            setItems((current) =>
                current.map((item) =>
                    item.key === key
                        ? { ...item, x: rect.x, y: rect.y, w: rect.w, h: rect.h }
                        : item
                )
            );
        },
        [setItems]
    );

    const { begin, move, end, rectFor } = useGridDrag({
        disabled,
        cellWidth,
        onCommit: commitRect,
    });

    const placedRects = useMemo(
        () =>
            items.map((item) =>
                clampRect({
                    x: item.x ?? 0,
                    y: item.y ?? 0,
                    w: item.w ?? 1,
                    h: item.h ?? 1,
                })
            ),
        [items]
    );

    const rowCount = useMemo(
        () => Math.max(6, placedRects.reduce((max, rect) => Math.max(max, rect.y + rect.h), 0) + 1),
        [placedRects]
    );

    const canvasHeight = rowCount * GRID_ROW_HEIGHT + (rowCount - 1) * GRID_GAP;

    /** Nudge a cell by whole grid units; keeps placement keyboard-accessible. */
    function nudge(key: string, dx: number, dy: number) {
        setItems((current) =>
            current.map((item) => {
                if (item.key !== key) return item;
                const rect = clampRect({
                    x: (item.x ?? 0) + dx,
                    y: (item.y ?? 0) + dy,
                    w: item.w ?? 1,
                    h: item.h ?? 1,
                });
                return { ...item, ...rect };
            })
        );
    }

    return (
        <>
            <div className="isolate overflow-x-auto rounded-xl border p-3">
                <div className="min-w-[420px]" style={{ width: `${zoom * 100}%` }}>
                    <div ref={canvasRef} className="relative w-full">
                        {showGrid ? <GridOverlay cellWidth={cellWidth} /> : null}
                        <div className="relative" style={{ height: canvasHeight }}>
                            {items.map((item, index) => {
                                const rect = rectFor(item.key, placedRects[index]);
                                const isSpacerCell = item.kind === SPACER_KIND;
                                return (
                                    <div
                                        key={item.key}
                                        style={{
                                            // Step and size both include the
                                            // gaps between the columns a cell
                                            // spans, matching CSS Grid's `gap`.
                                            left: rect.x * (cellWidth + GRID_GAP),
                                            top: rect.y * (GRID_ROW_HEIGHT + GRID_GAP),
                                            width: rect.w * cellWidth + (rect.w - 1) * GRID_GAP,
                                            height:
                                                rect.h * GRID_ROW_HEIGHT + (rect.h - 1) * GRID_GAP,
                                        }}
                                        onPointerDownCapture={() => setSelectedKey(item.key)}
                                        className={cn(
                                            "group absolute touch-none select-none",
                                            selectedItem?.key === item.key && "z-10"
                                        )}
                                    >
                                        <div
                                            onPointerDown={(event) =>
                                                begin(event, item.key, "move", rect)
                                            }
                                            onPointerMove={move}
                                            onPointerUp={end}
                                            onPointerCancel={end}
                                            className={cn(
                                                "relative h-full w-full cursor-grab overflow-hidden rounded-lg border bg-neutral-100 active:cursor-grabbing dark:bg-neutral-900",
                                                isSpacerCell
                                                    ? "border-dashed bg-transparent"
                                                    : "border-border",
                                                selectedItem?.key === item.key &&
                                                    "ring-2 ring-primary ring-offset-2"
                                            )}
                                        >
                                            {isSpacerCell ? (
                                                <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                                                    Blank space
                                                </span>
                                            ) : (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={item.url}
                                                    alt={item.alt || "Photo"}
                                                    draggable={false}
                                                    className={cn(
                                                        "h-full w-full",
                                                        item.originalAspect
                                                            ? "object-contain"
                                                            : "object-cover"
                                                    )}
                                                />
                                            )}

                                            {!isSpacerCell ? (
                                                <div className="absolute top-1 left-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                                                    {coverKey === item.key
                                                        ? "Cover"
                                                        : `#${index + 1}`}
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Resize handle */}
                                        <button
                                            type="button"
                                            aria-label={`Resize cell ${index + 1} with arrow keys`}
                                            onFocus={() => setSelectedKey(item.key)}
                                            onKeyDown={(event) => {
                                                const dx =
                                                    Number(event.key === "ArrowRight") -
                                                    Number(event.key === "ArrowLeft");
                                                const dy =
                                                    Number(event.key === "ArrowDown") -
                                                    Number(event.key === "ArrowUp");
                                                if (!dx && !dy) return;
                                                event.preventDefault();
                                                commitRect(item.key, applyResize(rect, { dx, dy }));
                                            }}
                                            onPointerDown={(event) =>
                                                begin(event, item.key, "resize", rect)
                                            }
                                            onPointerMove={move}
                                            onPointerUp={end}
                                            onPointerCancel={end}
                                            className={cn(
                                                "absolute -right-1 -bottom-1 flex size-7 cursor-nwse-resize items-center justify-center rounded-full border bg-background opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                                                selectedItem?.key === item.key && "opacity-100"
                                            )}
                                        >
                                            <Maximize2 className="size-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {items.length === 0 ? (
                <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No cells yet. Add photos, then drag them into place.
                </p>
            ) : (
                selectedItem && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-xs">
                        <label htmlFor="layout-cell">Selected cell</label>
                        <Select value={selectedItem.key} onValueChange={setSelectedKey}>
                            <SelectTrigger id="layout-cell" size="sm" className="max-w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {items.map((cell, index) => (
                                    <SelectItem key={cell.key} value={cell.key}>
                                        #{index + 1} ·{" "}
                                        {cell.kind === SPACER_KIND
                                            ? "Blank space"
                                            : cell.alt || "Photo"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedItem.kind === SPACER_KIND ? (
                            <span className="text-muted-foreground">blank</span>
                        ) : (
                            <input
                                value={selectedItem.alt}
                                onChange={(event) =>
                                    setItems((current) =>
                                        current.map((candidate) =>
                                            candidate.key === selectedItem.key
                                                ? { ...candidate, alt: event.target.value }
                                                : candidate
                                        )
                                    )
                                }
                                aria-label="Photo alt text"
                                placeholder="Alt text"
                                className="h-7 w-28 rounded border bg-transparent px-1.5"
                            />
                        )}
                        <span className="tabular-nums text-muted-foreground">
                            {selectedItem.w}×{selectedItem.h}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Move up"
                            onClick={() => nudge(selectedItem.key, 0, -1)}
                        >
                            <ChevronUp className="size-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Move down"
                            onClick={() => nudge(selectedItem.key, 0, 1)}
                        >
                            <ChevronDown className="size-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Move left"
                            onClick={() => nudge(selectedItem.key, -1, 0)}
                        >
                            <ChevronUp className="size-3.5 -rotate-90" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Move right"
                            onClick={() => nudge(selectedItem.key, 1, 0)}
                        >
                            <ChevronUp className="size-3.5 rotate-90" />
                        </Button>
                        {(["Width", "Height"] as const).map((axis) => (
                            <div key={axis} className="flex items-center gap-1">
                                <span>{axis}</span>
                                {[-1, 1].map((delta) => {
                                    const rect = placedRects[selectedIndex];
                                    const next = applyResize(rect, {
                                        dx: axis === "Width" ? delta : 0,
                                        dy: axis === "Height" ? delta : 0,
                                    });
                                    return (
                                        <Button
                                            key={delta}
                                            size="icon-sm"
                                            variant="outline"
                                            disabled={next.w === rect.w && next.h === rect.h}
                                            aria-label={`${delta < 0 ? "Decrease" : "Increase"} ${axis.toLowerCase()}`}
                                            onClick={() => commitRect(selectedItem.key, next)}
                                        >
                                            {delta < 0 ? "−" : "+"}
                                        </Button>
                                    );
                                })}
                            </div>
                        ))}
                        {selectedItem.kind !== SPACER_KIND && (
                            <Button
                                variant="outline"
                                size="sm"
                                aria-pressed={selectedItem.originalAspect}
                                onClick={() => {
                                    const useOriginal = !selectedItem.originalAspect;
                                    setItems((current) =>
                                        current.map((item) =>
                                            item.key === selectedItem.key
                                                ? {
                                                      ...item,
                                                      originalAspect: useOriginal,
                                                      h: useOriginal
                                                          ? photoAspectRows(
                                                                item.width,
                                                                item.height,
                                                                placedRects[selectedIndex].w,
                                                                cellWidth
                                                            )
                                                          : item.h,
                                                  }
                                                : item
                                        )
                                    );
                                }}
                            >
                                {selectedItem.originalAspect
                                    ? "Original ratio"
                                    : "Use original ratio"}
                            </Button>
                        )}
                        {selectedItem.kind === SPACER_KIND ? null : (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Use as cover"
                                onClick={() => setCoverKey(selectedItem.key)}
                            >
                                <Star
                                    className={cn(
                                        "size-3.5",
                                        coverKey === selectedItem.key && "fill-current text-primary"
                                    )}
                                />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Remove cell"
                            onClick={() => remove(selectedItem.key)}
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                )
            )}
        </>
    );
}

/**
 * Faint column guides so placement is easier to judge.
 *
 * Drawn at the real column width and step rather than as a percentage, because a
 * percentage ignores the gaps and would drift out of line with the cells.
 */
function GridOverlay({ cellWidth }: { cellWidth: number }) {
    const lines = Array.from({ length: GRID_COLUMNS }, (_, index) => index);
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.35]">
            {lines.map((index) => (
                <div
                    key={index}
                    className="absolute top-0 bottom-0 border-l border-current"
                    style={{
                        left: index * (cellWidth + GRID_GAP),
                        width: cellWidth,
                    }}
                />
            ))}
        </div>
    );
}
