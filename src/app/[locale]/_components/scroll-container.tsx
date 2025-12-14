"use client";

import { useState, useEffect } from "react";
// import { toast } from "sonner";
// import { useTranslations } from "next-intl";
import Image from "next/image";

import AOS from "aos";

interface ScrollContainerProps {
    children: React.ReactNode;
}

export default function ScrollContainer({ children }: ScrollContainerProps) {
    // const t = useTranslations("scroll-toast");

    // const [snapBackCount, setSnapBackCount] = useState(0);
    // const [lastScrollDirection, setLastScrollDirection] = useState<"down" | "up" | null>(null);
    // const [hasOfferedDisableSnap, setHasOfferedDisableSnap] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);

    // Initialize AOS on mount
    useEffect(() => {
        AOS.init({
            once: true,
        });
    }, []);

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
            className={`w-full overflow-y-auto overflow-x-hidden relative h-[calc(100vh-3.5rem)] box-border main-content snap-y snap-mandatory pointer-coarse:snap-mandatory border-none ring-0 outline-none`}
            onScroll={(e) => {
                const target = e.currentTarget as HTMLElement;
                setScrollPosition(target.scrollTop);
                AOS.refresh();
            }}
        >
            <Image
                src={scrollPosition < 200 ? "/images/cat-icon-1.png" : "/images/cat-icon-2.png"}
                alt=""
                width={371}
                height={280}
                priority
                quality={70}
                className={`z-0 block absolute bottom-0 right-2 md:right-10 max-w-52 fade-in duration-400 transition-transform ${scrollPosition > 100 ? "translate-y-20" : ""} opacity-85 dark:opacity-0`}
            />
            {children}
        </main>
    );
}
