"use client";

import { useState, useEffect } from "react";

interface ScrollContainerProps {
    children: React.ReactNode;
}

function isTrackpadEvent(e: WheelEvent): boolean {
    // If deltas are given in lines/pages it's usually a mouse wheel (discrete steps).
    // deltaMode: 0 = Pixel, 1 = Line, 2 = Page
    if (e.deltaMode === 1 || e.deltaMode === 2) return false;

    //  < 15 px is usually fine-grained (trackpad)
    //  fractional values (non-integer) are typically produced by touchpads
    if (Math.abs(e.deltaY) < 15 || Math.abs(e.deltaY) % 1 !== 0) return true;

    // Some platforms (Windows) produce wheelDelta multiples of 120 for mouse wheels.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacy = (e as any).wheelDelta;
    if (typeof legacy === "number") {
        if (Math.abs(legacy) % 120 === 0) return false;
    }

    // Check if the deltaY is small, indicating a trackpad scroll
    return Math.abs(e.deltaY) < 50;
}

export default function ScrollContainer({ children }: ScrollContainerProps) {
    const [inputMethod, setInputMethod] = useState<"mouse" | "touch" | "unknown">("unknown");

    useEffect(() => {
        const handleWheelMove = (e: WheelEvent ) => {
            if (isTrackpadEvent(e)) {
                setInputMethod("touch");
            } else {
                setInputMethod("mouse");
            }
        };

        const handleTouchStart = () => {
            setInputMethod("touch");
        };

        window.addEventListener("wheel", handleWheelMove, false);
        window.addEventListener("touchstart", handleTouchStart);
        
        return () => {
            window.removeEventListener("wheel", handleWheelMove);
            window.removeEventListener("touchstart", handleTouchStart);
        };
    }, []);

    const snapClass = inputMethod === "mouse" ? "snap-proximity " : "snap-mandatory";

    return (
        <main className={`w-full snap-y overflow-y-auto relative h-[calc(100vh-3.5rem)] box-border main-content ${snapClass}`}>
            {children}
        </main>
    );
}