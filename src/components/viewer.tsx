"use client";

import { useEffect, useState, MouseEvent, startTransition, ViewTransition } from "react";
import { Cross1Icon, SizeIcon, DownloadIcon } from "@radix-ui/react-icons";

export function OpenViewerLink({
    viewer,
    transitionName,
    className,
    children,
}: {
    viewer: string;
    /** Shared ViewTransition name (e.g. project id) for desktop morph */
    transitionName: string;
    className?: string;
    children: React.ReactNode;
}) {
    const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (!viewer) return;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );

        if (isMobile) {
            window.open(viewer, "_blank");
        } else {
            const url = new URL(window.location.href);
            url.searchParams.set("viewer", viewer);
            url.searchParams.set("vt", transitionName);
            window.history.replaceState(null, "", url.toString());
            startTransition(() => {
                window.dispatchEvent(new Event("viewerchange"));
            });
        }
    };
    return (
        <a href={`?viewer=${encodeURIComponent(viewer)}`} className={className} onClick={onClick}>
            {children}
        </a>
    );
}

export default function Viewer() {
    const [isVisible, setIsVisible] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [shareName, setShareName] = useState<string | null>(null);

    useEffect(() => {
        const updateFromUrl = () => {
            const params = new URL(window.location.href).searchParams;
            const v = params.get("viewer")?.trim() || null;
            const vt = params.get("vt")?.trim() || null;
            startTransition(() => {
                setViewerUrl(v);
                setShareName(v ? vt : null);
                setIsVisible(!!v);
            });
        };
        updateFromUrl();
        const onPopState = () => updateFromUrl();
        const onViewerChange = () => updateFromUrl();
        window.addEventListener("popstate", onPopState);
        window.addEventListener("viewerchange", onViewerChange);
        return () => {
            window.removeEventListener("popstate", onPopState);
            window.removeEventListener("viewerchange", onViewerChange);
        };
    }, []);

    const closeViewer = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("viewer");
        url.searchParams.delete("vt");
        window.history.replaceState(null, "", url.toString());
        startTransition(() => {
            window.dispatchEvent(new Event("viewerchange"));
        });
    };

    const goToPage = () => {
        const page = viewerUrl?.trim();
        const url = new URL(window.location.href);
        url.searchParams.delete("viewer");
        url.searchParams.delete("vt");
        window.history.replaceState(null, "", url.toString());
        startTransition(() => {
            window.dispatchEvent(new Event("viewerchange"));
        });
        if (page) {
            window.open(page, "_blank");
        }
    };

    const downloadFile = () => {
        const file = viewerUrl?.trim();
        if (file && file.endsWith(".pdf")) {
            fetch(file)
                .then((res) => res.blob())
                .then((blob) => {
                    const objectUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = objectUrl;
                    a.download = file.split("/").pop() || "download.pdf";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(objectUrl);
                })
                .catch((err) => console.error(err));
        }
    };

    const panel = (
        <div
            className={`max-h-dvh relative z-10 rounded-2xl border border-gray-300 dark:border-neutral-700 shadow-lg shadow-gray-400/10 dark:shadow-gray-900/50 overflow-auto m-1 md:m-6 flex flex-col w-full max-w-280 ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"} transition-all duration-200`}
        >
            <div
                className="flex w-full justify-end  bg-accent border-b"
                onClick={(e) => e.stopPropagation()}
            >
                {viewerUrl?.endsWith(".pdf") && (
                    <ViewerButton onClickFunction={downloadFile} ariaLabel="Download PDF">
                        <DownloadIcon width={25} />
                    </ViewerButton>
                )}
                <ViewerButton onClickFunction={goToPage} ariaLabel="Go to Page">
                    <SizeIcon width={25} />
                </ViewerButton>
                <ViewerButton onClickFunction={closeViewer} ariaLabel="Close Viewer">
                    <Cross1Icon width={25} />
                </ViewerButton>
            </div>
            {isVisible && (
                <iframe
                    src={
                        viewerUrl
                            ? `${viewerUrl}${viewerUrl.endsWith(".pdf") ? "#toolbar=0" : ""}`
                            : ""
                    }
                    width="100%"
                    height="100%"
                    className="min-h-[80vh] bg-background"
                    onClick={(e) => e.stopPropagation()}
                />
            )}
        </div>
    );

    return (
        <div
            className={`fixed top-0 left-0 w-screen h-screen flex justify-center items-stretch z-9999 transition-all border-0 ${isVisible ? "" : "pointer-events-none"}`}
            onClick={closeViewer}
        >
            <div
                className={`absolute inset-0 z-0 transition-opacity duration-150 bg-black/20 ${isVisible ? "opacity-100" : "opacity-0"}`}
            />
            {shareName && isVisible ? (
                <ViewTransition name={shareName} share="project-open" default="none">
                    {panel}
                </ViewTransition>
            ) : (
                panel
            )}
        </div>
    );
}

function ViewerButton({
    onClickFunction,
    children,
    ariaLabel,
}: {
    onClickFunction: () => void;
    children: React.ReactNode;
    ariaLabel?: string;
}) {
    return (
        <button
            onClick={onClickFunction}
            className="hover:pointer-cursor hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-2.5 transition-colors"
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
}
