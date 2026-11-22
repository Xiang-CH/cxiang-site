import { type Metadata } from "next";
import { type ReactNode } from "react";

/** The Studio is an authoring tool: never index it, never cache it. */
export const metadata: Metadata = {
    title: "Studio",
    robots: { index: false, follow: false, nocache: true },
};

export default function StudioLayout({ children }: { children: ReactNode }) {
    return <div className="mx-auto w-full max-w-5xl py-6">{children}</div>;
}
