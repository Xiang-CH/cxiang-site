"use client";

import { useEffect } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { scrambleThen } from "@/lib/home-text-scramble";

export function TerminalHomeLocalePicker({ currentLocale }: { currentLocale: string }) {
    const router = useRouter();
    const { prefetch } = useNextRouter();

    // Match next-intl's explicitly prefixed locale-switch destination. Use the
    // native prefetch so warming another locale does not change the locale cookie.
    useEffect(() => {
        for (const code of Object.keys(locales)) {
            if (code !== currentLocale) prefetch(`/${code}`);
        }
    }, [currentLocale, prefetch]);

    return (
        <div className="flex gap-4 flex-wrap">
            {Object.entries(locales).map(([code, name]) => {
                const isActive = code === currentLocale;
                return (
                    <button
                        key={code}
                        type="button"
                        onPointerEnter={() => {
                            if (!isActive) prefetch(`/${code}`);
                        }}
                        onFocus={() => {
                            if (!isActive) prefetch(`/${code}`);
                        }}
                        onClick={() => {
                            if (code === currentLocale) return;
                            // Also start loading during the animation on touch devices
                            // or when an earlier prefetch has expired.
                            prefetch(`/${code}`);
                            const root =
                                document.querySelector<HTMLElement>(".home-scramble-scope");
                            const go = () => {
                                router.replace("/", {
                                    locale: code,
                                    transitionTypes: ["locale-switch"],
                                });
                            };
                            if (root) {
                                scrambleThen(root, go, { tickMs: 45, holdMs: 240 });
                            } else {
                                go();
                            }
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
