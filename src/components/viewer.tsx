"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Cross1Icon, SizeIcon } from "@radix-ui/react-icons";

export default function Viewer() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(searchParams.get("viewer")?.trim() != null);

    useEffect(() => {
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

    return (
        <div
            className={`fixed top-0 left-0 w-[100vw] h-[100vh] flex justify-center  items-stretch z-100 ${isVisible ? "opacity-100" : "opacity-1000 pointer-events-none"}`}
            onClick={closeViewer}
        >
            <div
                className={`rounded-2xl border-[1px] border-gray-300 dark:border-neutral-700 shadow-lg shadow-gray-400/10 dark:shadow-gray-900/50 overflow-auto m-6 flex flex-col w-full max-w-[70rem]   ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"} transition-all`}
            >
                <div className="flex w-full justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={goToPage}
                        className="hover:pointer-cursor hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-3 transition-colors"
                    >
                        <SizeIcon width={30} />
                    </button>
                    <button
                        onClick={closeViewer}
                        className="hover:pointer-cursor hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-3 transition-colors"
                    >
                        <Cross1Icon width={30} />
                    </button>
                </div>
                {isVisible && (
                    <iframe
                        src={`${searchParams.get("viewer")}${searchParams.get("viewer")?.endsWith(".pdf") ? "#toolbar=0" : ""}` || ""}
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
