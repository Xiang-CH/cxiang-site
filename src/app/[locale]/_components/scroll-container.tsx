"use client";

import { useState, useEffect } from "react";
// import { toast } from "sonner";
// import { useTranslations } from "next-intl";
import Image from "next/image";
import { useTheme } from "next-themes";
import AOS from "aos";

interface ScrollContainerProps {
    children: React.ReactNode;
}

export default function ScrollContainer({ children }: ScrollContainerProps) {
    // const t = useTranslations("scroll-toast");
    const { resolvedTheme } = useTheme();

    // const [snapBackCount, setSnapBackCount] = useState(0);
    // const [lastScrollDirection, setLastScrollDirection] = useState<"down" | "up" | null>(null);
    // const [hasOfferedDisableSnap, setHasOfferedDisableSnap] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch by only rendering theme-dependent content after mount
    useEffect(() => {
        setIsMounted(true);
        AOS.init({
            once: true,
            disable: "mobile",
        });
    }, []);

    useEffect(() => {
        // let lastScrollTop = 0;
        // if (hasOfferedDisableSnap) {
        //     return;
        // }

        const handleScroll = (e: Event) => {
            const main = e.target as HTMLElement;
            if (!main) return;

            const currentScrollTop = main.scrollTop;
            setScrollPosition(currentScrollTop);
            // const scrollDirection = currentScrollTop > lastScrollTop ? "down" : "up";

            // Detect if user was scrolling down from intro but snapped back
            // console.log("lastScrollDirection", lastScrollDirection, "scrollDirection", scrollDirection, "diff", currentScrollTop - lastScrollTop);
            // if (
            //     lastScrollDirection === "down" &&
            //     scrollDirection === "up" &&
            //     Math.abs(currentScrollTop - lastScrollTop) > 10
            // ) {
            //     setSnapBackCount((prev) => prev + 1);
            //     console.log("Snap back detected", snapBackCount + 1);
            // }

            // setLastScrollDirection(scrollDirection);
            // lastScrollTop = currentScrollTop;
        };

        const mainElement = document.querySelector("main");
        mainElement?.addEventListener("scroll", handleScroll);

        return () => {
            mainElement?.removeEventListener("scroll", handleScroll);
        };
    });
    // [lastScrollDirection, hasOfferedDisableSnap]);

    // // Show toast when snap back count reaches 2
    // useEffect(() => {
    //     if (snapBackCount >= 2 && !hasOfferedDisableSnap) {
    //         setHasOfferedDisableSnap(true);
    //         // console.log("Offering to disable snap");
    //         toast(t("title"), {
    //             description: t("description"),
    //             action: {
    //                 label: t("action"),
    //                 onClick: () => {
    //                     const main = document.querySelector("main");
    //                     if (main) {
    //                         main.style.scrollSnapType = "none";
    //                         toast.success(t("success"));
    //                     }
    //                 },
    //             },
    //             duration: 10000,
    //         });
    //     }
    // }, [snapBackCount, hasOfferedDisableSnap, t]);

    return (
        <main
            className={`w-full overflow-y-auto overflow-x-hidden relative h-[calc(100dvh-3.5rem)] box-border main-content snap-y snap-mandatory pointer-coarse:snap-mandatory border-none ring-0 outline-none`}
            onScroll={() => {
                AOS.refresh();
            }}
        >
            {isMounted && (
                <Image
                    src={scrollPosition < 200 ? "/images/cat-icon-1.png" : "/images/cat-icon-2.png"}
                    alt=""
                    width={371}
                    height={280}
                    className={`z-0 block absolute bottom-0 right-2 md:right-10 max-w-[13rem] fade-in duration-400 transition-transform ${
                        scrollPosition > 100 ? "translate-y-20" : ""
                    } ${resolvedTheme === "light" ? "opacity-85" : "opacity-0"}`}
                />
            )}
            {children}
        </main>
    );
}
