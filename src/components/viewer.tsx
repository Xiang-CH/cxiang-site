"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Cross1Icon, SizeIcon, DownloadIcon } from "@radix-ui/react-icons";

export default function Viewer() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const isVisible = searchParams.get("viewer")?.trim() != null;
        setIsVisible(isVisible);
    }, [searchParams]);

    const closeViewer = () => {
        setIsVisible(false);
        const url = new URL(window.location.href);
        url.searchParams.delete("viewer");
        router.replace(url.toString());
    };
    const goToPage = () => {
        const page = searchParams.get("viewer")?.trim();
        const url = new URL(window.location.href);
        url.searchParams.delete("viewer");
        router.push(url.toString());
        window.open(page, "_blank");
    };
    const downloadFile = () => {
        const file = searchParams.get("viewer")?.trim();
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

    if (!isMounted) {
        return null;
    }

    return (
        <div
            className={`fixed top-0 left-0 w-[100vw] h-[100vh] flex justify-center items-stretch z-100! ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"} transition-all border-0`}
            onClick={closeViewer}
        >
            <div
                className={`rounded-2xl border-[1px] border-gray-300 dark:border-neutral-700 shadow-lg shadow-gray-400/10 dark:shadow-gray-900/50 overflow-auto m-1 md:m-6 flex flex-col w-full max-w-[70rem] ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"} transition-all`}
            >
                <div
                    className="flex w-full justify-end  bg-background"
                    onClick={(e) => e.stopPropagation()}
                >
                    {searchParams.get("viewer")?.endsWith(".pdf") && (
                        <ViewerButton onClickFunction={downloadFile}>
                            <DownloadIcon width={30} />
                        </ViewerButton>
                    )}
                    <ViewerButton onClickFunction={goToPage}>
                        <SizeIcon width={30} />
                    </ViewerButton>
                    <ViewerButton onClickFunction={closeViewer}>
                        <Cross1Icon width={30} />
                    </ViewerButton>
                </div>
                {isVisible && (
                    <iframe
                        src={
                            `${searchParams.get("viewer")}${searchParams.get("viewer")?.endsWith(".pdf") ? "#toolbar=0" : ""}` ||
                            ""
                        }
                        width="100%"
                        height="100%"
                        className="min-h-[80vh]"
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
            className="hover:pointer-cursor hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-3 transition-colors"
        >
            {children}
        </button>
    );
}
