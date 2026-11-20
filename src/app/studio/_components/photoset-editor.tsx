"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, SquareDashed, Trash2 } from "lucide-react";
import { PhotoLayout, type EditorItem } from "./photo-layout";
import { Button } from "@/components/ui/button";
import { clampRect, findFreeRect, resolveLayout } from "@/lib/gallery-grid";
import { PHOTO_KIND, SPACER_KIND, type PhotoSize } from "@/lib/gallery-shared";
import type { StudioPhotoSet } from "@/lib/photoset-payload";
import {
    DEFAULT_WEBP_QUALITY,
    MAX_WEBP_QUALITY,
    MIN_WEBP_QUALITY,
    encodeToWebp,
    formatBytes,
} from "@/lib/image-conversion";

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

async function discardUpload(storageKey: string) {
    const response = await fetch("/api/studio/uploads/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageKey }),
        keepalive: true,
    });
    if (!response.ok) throw new Error("Could not discard the upload");
}

export default function PhotosetEditor({ photoset }: { photoset: StudioPhotoSet }) {
    const router = useRouter();
    const pendingUploads = useRef(new Set<string>());
    const mounted = useRef(true);
    const savingCollection = useRef(false);
    useEffect(() => {
        mounted.current = true;
        const pending = pendingUploads.current;
        function discardOnExit() {
            if (!savingCollection.current) {
                for (const key of pending) void discardUpload(key).catch(console.error);
            }
        }
        function onPageHide(event: PageTransitionEvent) {
            if (!event.persisted) discardOnExit();
        }
        window.addEventListener("pagehide", onPageHide);
        return () => {
            window.removeEventListener("pagehide", onPageHide);
            mounted.current = false;
            discardOnExit();
        };
    }, []);

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
            };
        });
    });
    const [chosenCover, setCoverKey] = useState<string | null>(photoset.coverPhotoId ?? null);
    const coverKey =
        items.find((item) => item.key === chosenCover && item.kind !== SPACER_KIND)?.key ??
        items.find((item) => item.kind !== SPACER_KIND)?.key ??
        null;

    const [saving, setSaving] = useState(false);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [webpQuality, setWebpQuality] = useState(DEFAULT_WEBP_QUALITY);
    const [zoom, setZoom] = useState(1);
    const [showGrid, setShowGrid] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isNew = photoset.id === "new";
    const uploading = uploadingCount > 0;

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
            return [...current, { ...partial, ...rect, size: "medium" } as EditorItem];
        });
    }

    async function onFilesSelected(files: FileList | null) {
        if (!files || files.length === 0) return;
        const list = Array.from(files);

        let converted = 0;
        let savedBytes = 0;
        let fallback = 0;

        for (const original of list) {
            if (!mounted.current) break;
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
                if (!mounted.current) {
                    await discardUpload(uploaded.storageKey);
                    break;
                }
                pendingUploads.current.add(uploaded.storageKey);
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

    async function remove(key: string) {
        const item = items.find((candidate) => candidate.key === key);
        if (item?.storageKey && pendingUploads.current.has(item.storageKey)) {
            setSaving(true);
            try {
                await discardUpload(item.storageKey);
                pendingUploads.current.delete(item.storageKey);
            } catch {
                toast.error("Could not discard the upload. Please retry.");
                return;
            } finally {
                setSaving(false);
            }
        }
        setItems((current) => current.filter((candidate) => candidate.key !== key));
        setCoverKey((current) => (current === key ? null : current));
    }

    async function discardPendingUploads() {
        for (const key of pendingUploads.current) {
            await discardUpload(key);
            pendingUploads.current.delete(key);
            setItems((current) => current.filter((item) => item.storageKey !== key));
        }
    }

    async function leaveEditor() {
        setSaving(true);
        try {
            await discardPendingUploads();
            router.push("/studio");
        } catch {
            toast.error("Could not discard the uploads. Please retry.");
            setSaving(false);
        }
    }

    async function onSave() {
        const realPhotos = items.filter((item) => item.kind !== SPACER_KIND);
        if (realPhotos.length === 0) {
            toast.error("Add at least one photo before saving.");
            return;
        }

        setSaving(true);
        try {
            savingCollection.current = true;
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

            pendingUploads.current.clear();
            toast.success(published ? "Published" : "Saved as a draft");
            router.push("/studio");
            router.refresh();
        } catch (error) {
            if (!mounted.current) {
                for (const key of pendingUploads.current)
                    void discardUpload(key).catch(console.error);
            }
            toast.error(error instanceof Error ? error.message : "Could not save");
        } finally {
            savingCollection.current = false;
            setSaving(false);
        }
    }

    async function onDelete() {
        if (isNew) {
            await leaveEditor();
            return;
        }
        if (!window.confirm(`Delete "${title}" and its photos? This cannot be undone.`)) return;

        setSaving(true);
        try {
            await discardPendingUploads();
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
                        Select a photo to adjust its layout below the canvas, or drag it into place.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={leaveEditor} disabled={busy}>
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
                            disabled={busy}
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

                <fieldset disabled={saving} className="contents">
                    <PhotoLayout
                        items={items}
                        setItems={setItems}
                        coverKey={coverKey}
                        setCoverKey={setCoverKey}
                        remove={remove}
                        zoom={zoom}
                        showGrid={showGrid}
                    />
                </fieldset>
            </section>
        </div>
    );
}
