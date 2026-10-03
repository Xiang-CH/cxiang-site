"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ChevronDown,
    ChevronUp,
    GripVertical,
    ImagePlus,
    Loader2,
    Maximize2,
    SquareDashed,
    Star,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    GRID_COLUMNS,
    GRID_GAP,
    GRID_ROW_HEIGHT,
    clampRect,
    findFreeRect,
    resolveLayout,
    type GridRect,
} from "@/lib/gallery-grid";
import { PHOTO_KIND, SPACER_KIND, type PhotoSize } from "@/lib/gallery-shared";
import { type PhotoSetPhotoInput, type StudioPhotoSet } from "@/lib/photoset-payload";
import {
    DEFAULT_WEBP_QUALITY,
    MAX_WEBP_QUALITY,
    MIN_WEBP_QUALITY,
    encodeToWebp,
    formatBytes,
} from "@/lib/image-conversion";
import { useGridDrag } from "./use-grid-drag";

/**
 * Studio editor: free-form placement on a 12-column grid.
 *
 * Cells are dragged to move and dragged by their bottom-right corner to resize.
 * Placement is stored explicitly, so any cell nobody occupies stays blank — that
 * is how whitespace appears, and an explicit spacer cell reserves a block of it.
 */

type EditorItem = PhotoSetPhotoInput & {
    /** Stable React key; equals the photo id once saved, otherwise a local key. */
    key: string;
    width: number;
    height: number;
    localPreview?: string;
    uploadState: "ready" | "uploading" | "error";
};

const DEFAULT_PHOTO_RECT = { w: 6, h: 4 };
const DEFAULT_SPACER_RECT = { w: 4, h: 3 };

/**
 * Normalizes a slug while the user types.
 *
 * Leading and trailing hyphens are deliberately preserved: trimming on every
 * keystroke would delete the hyphen the moment it is typed, so `sunset-bay`
 * could never be typed by hand. Trimming happens on blur and again on save.
 */
function slugWhileTyping(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .slice(0, 255);
}

/** Trims the hyphens the typing normalizer leaves at the edges. */
function finalizeSlug(value: string): string {
    return value.replace(/^-+|-+$/g, "");
}

async function uploadOne(file: File) {
    const ticketResponse = await fetch("/api/studio/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type || "image/jpeg" }),
    });
    const ticket = (await ticketResponse.json().catch(() => ({}))) as {
        uploadUrl?: string;
        publicUrl?: string;
        storageKey?: string;
        error?: string;
    };
    if (!ticketResponse.ok || !ticket.uploadUrl || !ticket.publicUrl || !ticket.storageKey) {
        throw new Error(ticket.error ?? "Could not prepare the upload");
    }

    const put = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
    });
    if (!put.ok) throw new Error(`Upload failed (${put.status})`);

    return { publicUrl: ticket.publicUrl, storageKey: ticket.storageKey };
}

export default function PhotosetEditor({ photoset }: { photoset: StudioPhotoSet }) {
    const router = useRouter();

    const [title, setTitle] = useState(photoset.title);
    const [slug, setSlug] = useState(photoset.slug);
    const [abstract, setAbstract] = useState(photoset.abstract ?? "");
    const [shotOn, setShotOn] = useState(photoset.shotOn ?? "");
    const [shotOnEnd, setShotOnEnd] = useState(photoset.shotOnEnd ?? "");
    const [published, setPublished] = useState(photoset.published);

    const [items, setItems] = useState<EditorItem[]>(() => {
        const rects = resolveLayout(photoset.photos);
        return photoset.photos.map((photo, index) => {
            const rect = rects[index];
            return {
                ...photo,
                kind: photo.kind ?? PHOTO_KIND,
                x: rect.x,
                y: rect.y,
                w: rect.w,
                h: rect.h,
                width: photo.width ?? 1,
                height: photo.height ?? 1,
                size: (photo.size ?? "medium") as PhotoSize,
                key: photo.id ?? crypto.randomUUID(),
                uploadState: "ready" as const,
            };
        });
    });
    const [coverKey, setCoverKey] = useState<string | null>(() => {
        if (!photoset.coverPhotoId) return null;
        return photoset.photos.some((photo) => photo.id === photoset.coverPhotoId)
            ? photoset.coverPhotoId
            : null;
    });

    const [saving, setSaving] = useState(false);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [webpQuality, setWebpQuality] = useState(DEFAULT_WEBP_QUALITY);
    const [zoom, setZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasWidth, setCanvasWidth] = useState(720);

    const isNew = photoset.id === "new";
    const uploading = uploadingCount > 0;

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

    const commitRect = useCallback((key: string, rect: GridRect) => {
        setItems((current) =>
            current.map((item) =>
                item.key === key ? { ...item, x: rect.x, y: rect.y, w: rect.w, h: rect.h } : item
            )
        );
    }, []);

    const { drag, begin, move, end, rectFor } = useGridDrag({ cellWidth, onCommit: commitRect });

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

    /** Places a new cell in the first free slot and returns its key. */
    function addItem(
        partial: Partial<EditorItem> & { key: string },
        size: { w: number; h: number }
    ) {
        setItems((current) => {
            const occupied = current.map((item) =>
                clampRect({
                    x: item.x ?? 0,
                    y: item.y ?? 0,
                    w: item.w ?? 1,
                    h: item.h ?? 1,
                })
            );
            const rect = findFreeRect(occupied, { x: 0, y: 0, ...size });
            return [
                ...current,
                { ...partial, ...rect, size: "medium", uploadState: "ready" } as EditorItem,
            ];
        });
    }

    async function onFilesSelected(files: FileList | null) {
        if (!files || files.length === 0) return;
        const list = Array.from(files);

        let converted = 0;
        let savedBytes = 0;
        let fallback = 0;

        for (const original of list) {
            const key = crypto.randomUUID();
            setUploadingCount((count) => count + 1);
            try {
                // Encoding happens here because the bytes go straight to the
                // bucket; the server never sees the file.
                const encoded = await encodeToWebp(original, { quality: webpQuality });
                if (encoded.converted) {
                    converted += 1;
                    savedBytes += encoded.originalBytes - encoded.bytes;
                }
                if (encoded.fallback) fallback += 1;

                const uploaded = await uploadOne(encoded.file);
                addItem(
                    {
                        key,
                        kind: PHOTO_KIND,
                        url: uploaded.publicUrl,
                        storageKey: uploaded.storageKey,
                        alt: "",
                        width: encoded.width,
                        height: encoded.height,
                    },
                    DEFAULT_PHOTO_RECT
                );
                setCoverKey((current) => current ?? key);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Upload failed");
            } finally {
                setUploadingCount((count) => count - 1);
            }
        }

        if (converted > 0) {
            toast.success(
                `Converted ${converted} photo${converted === 1 ? "" : "s"} to WebP, saving ${formatBytes(savedBytes)}`
            );
        }
        if (fallback > 0) {
            toast.warning(`${fallback} file${fallback === 1 ? "" : "s"} could not be converted.`);
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function addSpacer() {
        addItem({ key: crypto.randomUUID(), kind: SPACER_KIND, alt: "" }, DEFAULT_SPACER_RECT);
    }

    const remove = useCallback(
        (key: string) => {
            const target = items.find((item) => item.key === key);
            setItems((current) => current.filter((item) => item.key !== key));
            setCoverKey((current) => (current === key ? null : current));

            // A photo that was never saved has no row, so save-time cleanup can
            // never reach its object; discard it instead of orphaning it.
            if (target && !target.id && target.storageKey) {
                void fetch("/api/studio/uploads/discard", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ storageKey: target.storageKey }),
                }).catch(() => {});
            }
        },
        [items]
    );

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

    async function onSave() {
        const realPhotos = items.filter((item) => item.kind !== SPACER_KIND);
        if (realPhotos.length === 0) {
            toast.error("Add at least one photo before saving.");
            return;
        }

        setSaving(true);
        try {
            const coverIndex = coverKey ? items.findIndex((item) => item.key === coverKey) : -1;
            const response = await fetch("/api/studio/photosets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: isNew ? undefined : photoset.id,
                    photoset: {
                        title: title.trim(),
                        slug: finalizeSlug(slug.trim()) || finalizeSlug(slugWhileTyping(title)),
                        abstract: abstract.trim() || undefined,
                        shotOn: shotOn || undefined,
                        shotOnEnd: shotOnEnd || undefined,
                        published,
                        coverPhotoId: coverIndex >= 0 ? items[coverIndex].id : undefined,
                        coverIndex: coverIndex >= 0 ? coverIndex : undefined,
                        photos: items.map((item) => ({
                            id: item.id,
                            kind: item.kind,
                            url: item.kind === SPACER_KIND ? undefined : item.url,
                            storageKey: item.storageKey,
                            alt: item.alt,
                            caption: item.caption,
                            width: item.kind === SPACER_KIND ? undefined : item.width,
                            height: item.kind === SPACER_KIND ? undefined : item.height,
                            x: item.x,
                            y: item.y,
                            w: item.w,
                            h: item.h,
                            size: item.size,
                        })),
                    },
                }),
            });

            const result = (await response.json().catch(() => ({}))) as {
                id?: string;
                error?: string;
            };
            if (!response.ok) throw new Error(result.error ?? "Could not save");

            toast.success(published ? "Published" : "Saved as a draft");
            router.push("/studio");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save");
        } finally {
            setSaving(false);
        }
    }

    async function onDelete() {
        if (isNew) {
            router.push("/studio");
            return;
        }
        if (!window.confirm(`Delete "${title}" and its photos? This cannot be undone.`)) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/studio/photosets?id=${photoset.id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const body = (await response.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? "Could not delete");
            }
            toast.success("Collection deleted");
            router.push("/studio");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not delete");
        } finally {
            setSaving(false);
        }
    }

    const busy = saving || uploading;

    return (
        <div className="flex flex-col gap-8">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-[450]">
                        {isNew ? "New collection" : photoset.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Drag a photo to move it, or its corner to resize. Blank cells stay empty.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push("/studio")}>
                        Back
                    </Button>
                    {!isNew ? (
                        <Button variant="outline" onClick={onDelete} disabled={busy}>
                            <Trash2 className="size-4" />
                            Delete
                        </Button>
                    ) : null}
                    <Button onClick={onSave} disabled={busy}>
                        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                        {published ? "Save & publish" : "Save draft"}
                    </Button>
                </div>
            </header>

            <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">Title</span>
                    <input
                        value={title}
                        onChange={(event) => {
                            setTitle(event.target.value);
                            if (isNew) setSlug(finalizeSlug(slugWhileTyping(event.target.value)));
                        }}
                        className="h-9 rounded-md border bg-transparent px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">URL slug</span>
                    <input
                        value={slug}
                        onChange={(event) => setSlug(slugWhileTyping(event.target.value))}
                        onBlur={(event) => setSlug(finalizeSlug(event.target.value))}
                        className="h-9 rounded-md border bg-transparent px-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                </label>
                <div className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">Shot from / to</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={shotOn}
                            max={shotOnEnd || undefined}
                            onChange={(event) => setShotOn(event.target.value)}
                            aria-label="Shot from"
                            className="h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        <span className="text-muted-foreground">–</span>
                        <input
                            type="date"
                            value={shotOnEnd}
                            min={shotOn || undefined}
                            onChange={(event) => setShotOnEnd(event.target.value)}
                            aria-label="Shot to (optional)"
                            className="h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                    </div>
                </div>
                <label className="flex items-center gap-2 self-end text-sm">
                    <input
                        type="checkbox"
                        checked={published}
                        onChange={(event) => setPublished(event.target.checked)}
                        className="size-4"
                    />
                    <span>Published (visible on /photos)</span>
                </label>
                <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                    <span className="text-muted-foreground">Description</span>
                    <textarea
                        value={abstract}
                        onChange={(event) => setAbstract(event.target.value)}
                        rows={2}
                        className="rounded-md border bg-transparent px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                </label>
            </section>

            <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-[450]">
                        Layout{" "}
                        <span className="font-normal text-muted-foreground">
                            ({items.length} cell{items.length === 1 ? "" : "s"})
                        </span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>WebP quality</span>
                            <input
                                type="range"
                                min={MIN_WEBP_QUALITY}
                                max={MAX_WEBP_QUALITY}
                                value={webpQuality}
                                onChange={(event) =>
                                    setWebpQuality(Number.parseInt(event.target.value, 10))
                                }
                                disabled={uploading}
                                className="w-20 accent-primary"
                                aria-label="WebP quality"
                            />
                            <span className="w-5 tabular-nums">{webpQuality}</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Zoom</span>
                            <input
                                type="range"
                                min={50}
                                max={140}
                                value={Math.round(zoom * 100)}
                                onChange={(event) =>
                                    setZoom(Number.parseInt(event.target.value, 10) / 100)
                                }
                                className="w-20 accent-primary"
                                aria-label="Canvas zoom"
                            />
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={showGrid}
                                onChange={(event) => setShowGrid(event.target.checked)}
                                className="size-3.5"
                            />
                            Grid
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                            multiple
                            className="hidden"
                            onChange={(event) => void onFilesSelected(event.target.files)}
                        />
                        <Button variant="outline" size="sm" onClick={addSpacer} disabled={busy}>
                            <SquareDashed className="size-4" />
                            Add blank space
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <ImagePlus className="size-4" />
                            )}
                            {uploading ? `Uploading ${uploadingCount}…` : "Add photos"}
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border p-3">
                    <div style={{ width: `${zoom * 100}%`, minWidth: 420 }}>
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
                                                position: "absolute",
                                                // Step and size both include the
                                                // gaps between the columns a cell
                                                // spans, matching CSS Grid's `gap`.
                                                left: rect.x * (cellWidth + GRID_GAP),
                                                top: rect.y * (GRID_ROW_HEIGHT + GRID_GAP),
                                                width: rect.w * cellWidth + (rect.w - 1) * GRID_GAP,
                                                height:
                                                    rect.h * GRID_ROW_HEIGHT +
                                                    (rect.h - 1) * GRID_GAP,
                                            }}
                                            className={cn(
                                                "group touch-none select-none",
                                                drag?.id === item.key && "z-20"
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
                                                    drag?.id === item.key && "ring-2 ring-primary"
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
                                                        className="h-full w-full object-cover"
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
                                                aria-label="Resize cell"
                                                onPointerDown={(event) =>
                                                    begin(event, item.key, "resize", rect)
                                                }
                                                onPointerMove={move}
                                                onPointerUp={end}
                                                onPointerCancel={end}
                                                className="absolute -right-1.5 -bottom-1.5 flex size-5 cursor-nwse-resize items-center justify-center rounded-full border bg-background opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
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
                    <ul className="flex flex-wrap gap-2">
                        {items.map((item, index) => (
                            <li
                                key={item.key}
                                className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs"
                            >
                                <GripVertical className="size-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">#{index + 1}</span>
                                {item.kind === SPACER_KIND ? (
                                    <span className="text-muted-foreground">blank</span>
                                ) : (
                                    <input
                                        value={item.alt}
                                        onChange={(event) =>
                                            setItems((current) =>
                                                current.map((candidate) =>
                                                    candidate.key === item.key
                                                        ? { ...candidate, alt: event.target.value }
                                                        : candidate
                                                )
                                            )
                                        }
                                        placeholder="Alt text"
                                        className="h-7 w-28 rounded border bg-transparent px-1.5"
                                    />
                                )}
                                <span className="tabular-nums text-muted-foreground">
                                    {item.w}×{item.h}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Move up"
                                    onClick={() => nudge(item.key, 0, -1)}
                                >
                                    <ChevronUp className="size-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Move down"
                                    onClick={() => nudge(item.key, 0, 1)}
                                >
                                    <ChevronDown className="size-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Move left"
                                    onClick={() => nudge(item.key, -1, 0)}
                                >
                                    <ChevronUp className="size-3.5 -rotate-90" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Move right"
                                    onClick={() => nudge(item.key, 1, 0)}
                                >
                                    <ChevronUp className="size-3.5 rotate-90" />
                                </Button>
                                {item.kind === SPACER_KIND ? null : (
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Use as cover"
                                        onClick={() => setCoverKey(item.key)}
                                    >
                                        <Star
                                            className={cn(
                                                "size-3.5",
                                                coverKey === item.key && "fill-current text-primary"
                                            )}
                                        />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Remove cell"
                                    onClick={() => remove(item.key)}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
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
