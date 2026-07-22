import type { ReactNode } from "react";
import { ViewTransition } from "react";

/**
 * Wraps children with view transition states for navigation to and from the CLI.
 *
 * @param children - The content rendered within the configured view transition.
 */
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
