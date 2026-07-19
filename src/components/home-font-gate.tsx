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
            <div className="home-font-gate fixed inset-0 z-[200] bg-background" />
            <noscript>
                <style>{".home-font-gate { display: none !important; }"}</style>
            </noscript>
        </>
    );
}
