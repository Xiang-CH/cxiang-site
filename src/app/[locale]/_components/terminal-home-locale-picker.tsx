"use client";

import { useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { scrambleThen } from "@/lib/home-text-scramble";

export function TerminalHomeLocalePicker({ currentLocale }: { currentLocale: string }) {
    const router = useRouter();

    return (
        <div className="flex gap-4 flex-wrap">
            {Object.entries(locales).map(([code, name]) => {
                const isActive = code === currentLocale;
                return (
                    <button
                        key={code}
                        type="button"
                        onClick={() => {
                            if (code === currentLocale) return;
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
