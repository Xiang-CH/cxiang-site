"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { ViewTransition } from "react";

export function BlogListLink({
    href,
    slug,
    coverPrefetchSrc,
    children,
}: {
    href: string;
    slug: string;
    /** When set, the cover image is requested once on hover (pointer enter) before navigation. */
    coverPrefetchSrc?: string | null;
    children: React.ReactNode;
}) {
    const didPrefetchCover = useRef(false);

    const prefetchCover = useCallback(() => {
        if (!coverPrefetchSrc || didPrefetchCover.current) return;
        didPrefetchCover.current = true;
        const img = new Image();
        img.src = coverPrefetchSrc;
    }, [coverPrefetchSrc]);

    return (
        <Link
            href={href}
            transitionTypes={["blog-open"]}
            className="w-full items-center group"
            onPointerEnter={prefetchCover}
        >
            <ViewTransition name={`blog-${slug}`} share="blog-open" default="none">
                {children}
            </ViewTransition>
        </Link>
    );
}
