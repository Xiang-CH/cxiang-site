"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { GRID_COLUMNS, GRID_GAP, GRID_ROW_HEIGHT, resolveLayout } from "@/lib/gallery-grid";
import { isSpacer, type GalleryCell } from "@/lib/gallery-shared";

/**
 * Renders a collection as a free-form grid and opens photos in a full-screen
 * viewer.
 *
 * Placement comes from each cell's stored rect, so any cell nobody occupies is
 * simply blank. On narrow screens the layout collapses to a single column in
 * order: a 12-column arrangement cannot be preserved on a phone without making
 * every photo too small to see.
 */
export default function PhotoLightbox({ photos }: { photos: GalleryCell[] }) {
    const [active, setActive] = useState<number | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);

    const rects = useMemo(() => resolveLayout(photos), [photos]);

    // Spacers carry no image, so only real photos are openable/navigable.
    const openableIndexes = useMemo(
        () => photos.map((cell, index) => ({ cell, index })).filter(({ cell }) => !isSpacer(cell)),
        [photos]
    );

    const isOpen = active !== null;

    const close = useCallback(() => {
        startTransition(() => setActive(null));
    }, []);

    const step = useCallback(
        (delta: number) => {
            startTransition(() => {
                setActive((current) => {
                    if (current === null) return current;
                    return (current + delta + openableIndexes.length) % openableIndexes.length;
                });
            });
        },
        [openableIndexes.length]
    );

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (isOpen && !dialog.open) dialog.showModal();
        else if (!isOpen && dialog.open) dialog.close();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                event.preventDefault();
                step(1);
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                step(-1);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, step]);

    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    const currentIndex = active ?? 0;
    const current = active === null ? null : (openableIndexes[active]?.cell ?? null);

    const openAt = (listIndex: number) =>
        setActive(openableIndexes.findIndex((entry) => entry.index === listIndex));

    return (
        <>
            {/*
             * Mobile: a single column in order, sized by each photo's own
             * aspect ratio. Desktop (`sm` +): absolutely placed cells on the grid.
             */}
            <div className="flex flex-col gap-3 sm:hidden">
                {photos.map((cell, index) =>
                    isSpacer(cell) ? (
                        <div
                            key={cell.id}
                            aria-hidden
                            // A desktop-sized hole would swamp a phone, so a
                            // spacer becomes a modest gap here.
                            style={{ height: GRID_ROW_HEIGHT * Math.min(cell.h ?? 2, 3) }}
                        />
                    ) : (
                        <button
                            key={cell.id}
                            type="button"
                            onClick={() => startTransition(() => openAt(index))}
                            aria-label={`View photo: ${cell.alt}`}
                            className="group block w-full overflow-hidden rounded-lg bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-neutral-900"
                        >
                            <Image
                                src={cell.src}
                                alt={cell.alt}
                                width={cell.width}
                                height={cell.height}
                                sizes="100vw"
                                quality={75}
                                className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.01]"
                            />
                        </button>
                    )
                )}
            </div>

            <div
                className="hidden sm:grid"
                style={{
                    gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
                    gridAutoRows: `${GRID_ROW_HEIGHT}px`,
                    gap: `${GRID_GAP}px`,
                    position: "relative",
                }}
            >
                {photos.map((cell, index) => {
                    const rect = rects[index];
                    return (
                        <div
                            key={cell.id}
                            style={{
                                gridColumn: `${rect.x + 1} / span ${rect.w}`,
                                gridRow: `${rect.y + 1} / span ${rect.h}`,
                            }}
                            className="min-w-0"
                        >
                            {isSpacer(cell) ? (
                                <div
                                    aria-hidden
                                    className="h-full w-full rounded-lg border border-dashed border-border/40"
                                />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => startTransition(() => openAt(index))}
                                    aria-label={`View photo: ${cell.alt}`}
                                    className="group relative block h-full w-full overflow-hidden rounded-lg bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-neutral-900"
                                >
                                    <Image
                                        src={cell.src}
                                        alt={cell.alt}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        quality={75}
                                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                    />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <dialog
                ref={dialogRef}
                onClose={close}
                onClick={(event) => {
                    if (event.target === dialogRef.current) close();
                }}
                className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/90 open:flex open:items-center open:justify-center"
            >
                {current ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-3 sm:p-6">
                        <Image
                            key={current.id}
                            src={current.src}
                            alt={current.alt}
                            width={current.width}
                            height={current.height}
                            sizes="100vw"
                            quality={75}
                            className="h-auto max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
                        />
                        <div className="flex max-w-2xl flex-col items-center gap-1 text-center">
                            <p className="text-sm text-white/90">
                                {current.caption ?? current.alt}
                            </p>
                            <p className="text-xs text-white/50">
                                {currentIndex + 1} / {openableIndexes.length}
                            </p>
                        </div>
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={close}
                    aria-label="Close viewer"
                    className="absolute top-3 right-3 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                    <X className="size-5" />
                </button>

                {openableIndexes.length > 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={() => step(-1)}
                            aria-label="Previous photo"
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-4"
                        >
                            <ChevronLeft className="size-6" />
                        </button>
                        <button
                            type="button"
                            onClick={() => step(1)}
                            aria-label="Next photo"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-4"
                        >
                            <ChevronRight className="size-6" />
                        </button>
                    </>
                ) : null}
            </dialog>
        </>
    );
}
