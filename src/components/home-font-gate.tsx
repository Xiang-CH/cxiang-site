"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";

const HOME_PATHS = new Set(["/en", "/zh-CN", "/"]);
const FONT_LOADING_TIMEOUT_MS = 5_000;

export default function HomeFontGate() {
    const pathname = usePathname();
    const normalizedPathname = pathname ? pathname.replace(/\/+$/, "") || "/" : null;
    const isHomeRoute = normalizedPathname !== null && HOME_PATHS.has(normalizedPathname);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const isVisible = isHomeRoute && !fontsLoaded;

    useLayoutEffect(() => {
        if (!isVisible) return;

        let isCurrent = true;
        const revealPage = () => {
            if (isCurrent) setFontsLoaded(true);
        };
        const timeoutId = window.setTimeout(revealPage, FONT_LOADING_TIMEOUT_MS);

        if (!("fonts" in document)) {
            revealPage();
        } else if (document.fonts.status === "loaded") {
            revealPage();
        } else {
            document.fonts.ready.then(revealPage, revealPage);
        }

        return () => {
            isCurrent = false;
            window.clearTimeout(timeoutId);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <>
            <div
                className="home-font-gate fixed inset-0 z-[200] grid place-items-center bg-background text-foreground"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <div className="font-mono flex items-center gap-3 border border-border px-4 py-3 text-xs tracking-[0.2em] text-muted-foreground uppercase">
                    <span className="flex gap-1" aria-hidden="true">
                        <span className="size-1.5 animate-pulse bg-primary motion-reduce:animate-none" />
                        <span className="size-1.5 animate-pulse bg-primary [animation-delay:150ms] motion-reduce:animate-none" />
                        <span className="size-1.5 animate-pulse bg-primary [animation-delay:300ms] motion-reduce:animate-none" />
                    </span>
                    Summoning pixels
                </div>
            </div>
            <noscript>
                <style>{".home-font-gate { display: none !important; }"}</style>
            </noscript>
        </>
    );
}
