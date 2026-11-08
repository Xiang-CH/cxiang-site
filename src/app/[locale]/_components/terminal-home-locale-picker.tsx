"use client";

import { useEffect, useRef, useState } from "react";
import { locales } from "@/i18n/routing";
import { startHomeLocaleNavigation } from "@/lib/home-locale-navigation";
import type { HomeScrambleController } from "@/lib/home-text-scramble";

export function TerminalHomeLocalePicker({ currentLocale }: { currentLocale: string }) {
    const [isSwitching, setIsSwitching] = useState(false);
    const navigation = useRef<HomeScrambleController | null>(null);

    useEffect(() => {
        const reset = () => {
            navigation.current?.cancel();
            navigation.current = null;
            setIsSwitching(false);
        };
        // Safari can restore this component's disabled state from its page cache.
        window.addEventListener("pageshow", reset);
        return () => {
            window.removeEventListener("pageshow", reset);
            navigation.current?.cancel();
            navigation.current = null;
        };
    }, []);

    return (
        <div className="flex gap-4 flex-wrap">
            {Object.entries(locales).map(([code, name]) => {
                const isActive = code === currentLocale;
                return (
                    <button
                        key={code}
                        type="button"
                        disabled={isSwitching}
                        aria-busy={!isActive && isSwitching}
                        onClick={(event) => {
                            if (code === currentLocale || navigation.current || isSwitching) return;
                            const root = event.currentTarget.closest(".home-scramble-scope");
                            if (!root) return;
                            setIsSwitching(true);
                            navigation.current = startHomeLocaleNavigation(root, code);
                        }}
                        className={`no-underline text-[0.88rem] transition-[color,border-color] duration-150 border-b bg-transparent cursor-pointer font-inherit ${
                            isActive
                                ? "text-(--th-text) font-bold border-b-(--th-accent)"
                                : "text-(--th-dim) font-normal border-b-(--th-link-ul)"
                        }`}
                    >
                        {name}
                    </button>
                );
            })}
        </div>
    );
}
