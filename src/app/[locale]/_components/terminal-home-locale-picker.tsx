"use client";

import { useLayoutEffect, useRef, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { runHomeTextScramble, type HomeScrambleController } from "@/lib/home-text-scramble";

export function TerminalHomeLocalePicker({ currentLocale }: { currentLocale: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const scramble = useRef<{ locale: string; controller: HomeScrambleController } | null>(null);

    useLayoutEffect(() => {
        if (!isPending || scramble.current?.locale !== currentLocale) {
            scramble.current?.controller.cancel();
            scramble.current = null;
        }
    }, [currentLocale, isPending]);

    useLayoutEffect(() => {
        return () => {
            scramble.current?.controller.cancel();
            scramble.current = null;
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
                        disabled={isPending}
                        aria-busy={!isActive && isPending}
                        onClick={(event) => {
                            if (code === currentLocale || scramble.current || isPending) return;
                            const root = event.currentTarget.closest(".home-scramble-scope");
                            if (root) {
                                scramble.current = {
                                    locale: currentLocale,
                                    controller: runHomeTextScramble(root, { tickMs: 45 }),
                                };
                            }
                            // Load immediately, but hold the same transition open for
                            // at least 500ms, even when the destination is cached.
                            startTransition(async () => {
                                router.replace("/", {
                                    locale: code,
                                    transitionTypes: ["locale-switch"],
                                });
                                await new Promise<void>((resolve) => {
                                    window.setTimeout(resolve, 500);
                                });
                            });
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
