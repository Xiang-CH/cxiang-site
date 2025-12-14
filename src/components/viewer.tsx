"use client";

import { useEffect, useState, MouseEvent } from "react";
import { Cross1Icon, SizeIcon, DownloadIcon } from "@radix-ui/react-icons";

export function OpenViewerLink({
    viewer,
    className,
    children,
}: {
    viewer: string;
    className?: string;
    children: React.ReactNode;
}) {
    const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (!viewer) return;
        const url = new URL(window.location.href);
        url.searchParams.set("viewer", viewer);
        window.history.replaceState(null, "", url.toString());
        window.dispatchEvent(new Event("viewerchange"));
    };
    return (
        <a href={`?viewer=${viewer}`} className={className} onClick={onClick}>
            {children}
        </a>
    );
}

export default function Viewer() {
    const [isVisible, setIsVisible] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);

    useEffect(() => {
        const updateFromUrl = () => {
            const v = new URL(window.location.href).searchParams.get("viewer")?.trim() || null;
            setViewerUrl(v);
            setIsVisible(!!v);
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
        setIsVisible(false);
        const url = new URL(window.location.href);
        url.searchParams.delete("viewer");
        window.history.replaceState(null, "", url.toString());
        window.dispatchEvent(new Event("viewerchange"));
    };

    const goToPage = () => {
        const page = viewerUrl?.trim();
        const url = new URL(window.location.href);
        url.searchParams.delete("viewer");
        window.history.replaceState(null, "", url.toString());
        window.dispatchEvent(new Event("viewerchange"));
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
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = file.split("/").pop() || "download.pdf";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                })
                .catch((err) => console.error(err));
        }
    };

    return (
        <div
            className={`fixed top-0 left-0 w-screen h-dvh flex justify-center items-stretch z-100! transition-all border-0 ${isVisible ? "" : "pointer-events-none"}`}
            onClick={closeViewer}
        >
            <div
                className={`absolute inset-0 transition-opacity bg-black/20 ${isVisible ? "opacity-100" : "opacity-0"}`}
            />
            <div
                className={`relative z-10 rounded-2xl border border-gray-300 dark:border-neutral-700 shadow-lg shadow-gray-400/10 dark:shadow-gray-900/50 overflow-auto m-1 md:m-6 flex flex-col w-full max-w-[70rem] ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"} transition-all`}
            >
                <div
                    className="flex w-full justify-end  bg-accent border-b"
                    onClick={(e) => e.stopPropagation()}
                >
                    {viewerUrl?.endsWith(".pdf") && (
                        <ViewerButton onClickFunction={downloadFile}>
                            <DownloadIcon width={25} />
                        </ViewerButton>
                    )}
                    <ViewerButton onClickFunction={goToPage}>
                        <SizeIcon width={25} />
                    </ViewerButton>
                    <ViewerButton onClickFunction={closeViewer}>
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
        </div>
    );
}

function ViewerButton({
    onClickFunction,
    children,
}: {
    onClickFunction: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClickFunction}
            className="hover:pointer-cursor hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-2.5 transition-colors"
        >
            {children}
        </button>
    );
}
