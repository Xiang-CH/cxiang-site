import type { ReactNode } from "react";
import { ViewTransition } from "react";

export function TerminalCliViewTransition({ children }: { children: ReactNode }) {
    return (
        <ViewTransition
            enter={{ "to-cli": "cli-enter", default: "none" }}
            exit={{ "from-cli": "cli-return-exit", default: "none" }}
            default="none"
        >
            {children}
        </ViewTransition>
    );
}
