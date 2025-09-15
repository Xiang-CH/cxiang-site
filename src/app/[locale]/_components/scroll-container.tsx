"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ScrollContainerProps {
    children: React.ReactNode;
}

export default function ScrollContainer({ children }: ScrollContainerProps) {
    const t = useTranslations("scroll-toast");

    const [snapBackCount, setSnapBackCount] = useState(0);
    const [lastScrollDirection, setLastScrollDirection] = useState<"down" | "up" | null>(null);
    const [hasOfferedDisableSnap, setHasOfferedDisableSnap] = useState(false);

    useEffect(() => {
        let lastScrollTop = 0;
        if (hasOfferedDisableSnap) {
            return;
        }

        const handleScroll = (e: Event) => {
            const main = e.target as HTMLElement;
            if (!main) return;

            const currentScrollTop = main.scrollTop;
            const scrollDirection = currentScrollTop > lastScrollTop ? "down" : "up";

            // Detect if user was scrolling down from intro but snapped back
            if (
                lastScrollDirection === "down" &&
                scrollDirection === "up" &&
                Math.abs(currentScrollTop - lastScrollTop) > 190
            ) {
                setSnapBackCount((prev) => prev + 1);
                console.log("Snap back detected", snapBackCount + 1);
            }

            setLastScrollDirection(scrollDirection);
            lastScrollTop = currentScrollTop;
        };

        const mainElement = document.querySelector("main");
        mainElement?.addEventListener("scroll", handleScroll);

        return () => {
            mainElement?.removeEventListener("scroll", handleScroll);
        };
    }, [lastScrollDirection, hasOfferedDisableSnap]);

    // Show toast when snap back count reaches 2
    useEffect(() => {
        if (snapBackCount >= 2 && !hasOfferedDisableSnap) {
            setHasOfferedDisableSnap(true);
            // console.log("Offering to disable snap");
            toast(t("title"), {
                description: t("description"),
                action: {
                    label: t("action"),
                    onClick: () => {
                        const main = document.querySelector("main");
                        if (main) {
                            main.style.scrollSnapType = "none";
                            toast.success(t("success"));
                        }
                    },
                },
                duration: 10000,
            });
        }
    }, [snapBackCount, hasOfferedDisableSnap, t]);

    return (
        <main
            className={`w-full overflow-y-auto relative h-[calc(100vh-3.5rem)] box-border main-content snap-y snap-mandatory`}
        >
            {children}
        </main>
    );
}
