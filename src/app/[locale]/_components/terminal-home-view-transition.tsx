import type { ReactNode } from "react";
import { ViewTransition } from "react";

export function TerminalHomeViewTransition({ children }: { children: ReactNode }) {
    return (
        <ViewTransition
            enter={{
                "to-home": "home-enter",
                "locale-switch": "home-enter-soft",
                default: "home-enter-soft",
            }}
            exit={{
                "from-home": "home-exit",
                "locale-switch": "home-exit-soft",
                default: "home-exit-soft",
            }}
            default="none"
        >
            {children}
        </ViewTransition>
    );
}
