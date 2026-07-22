"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOBILE_BREAKPOINT = 640;
const BOTTOM_THRESHOLD = 24;

export function TerminalHomeCliLauncher({ href, label }: { href: string; label: string }) {
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const mobileMedia = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const updateVisibility = () => {
            const shouldHide =
                mobileMedia.matches &&
                window.scrollY + window.innerHeight >=
                    document.documentElement.scrollHeight - BOTTOM_THRESHOLD;

            setIsHidden((current) => (current === shouldHide ? current : shouldHide));
        };

        updateVisibility();
        window.addEventListener("scroll", updateVisibility, { passive: true });
        window.addEventListener("resize", updateVisibility);
        mobileMedia.addEventListener("change", updateVisibility);

        return () => {
            window.removeEventListener("scroll", updateVisibility);
            window.removeEventListener("resize", updateVisibility);
            mobileMedia.removeEventListener("change", updateVisibility);
        };
    }, []);

    return (
        <Button
            asChild
            size="icon"
            variant="outline"
            className={`fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 border-(--th-border)! bg-(--th-bg)! text-(--th-accent) shadow-lg transition-opacity duration-700 ease-out hover:bg-(--th-skill-hover)! hover:text-(--th-bright)! ${
                isHidden ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
        >
            <Link
                href={href}
                transitionTypes={["to-cli"]}
                aria-label={label}
                title={label}
                aria-hidden={isHidden || undefined}
                tabIndex={isHidden ? -1 : undefined}
            >
                <TerminalIcon aria-hidden="true" />
            </Link>
        </Button>
    );
}
