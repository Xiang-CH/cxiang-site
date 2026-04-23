"use client";

import Link from "next/link";
import { ViewTransition } from "react";

export function BlogListLink({
    href,
    slug,
    children,
}: {
    href: string;
    slug: string;
    children: React.ReactNode;
}) {
    return (
        <Link href={href} transitionTypes={["blog-open"]} className="w-full items-center group">
            <ViewTransition name={`blog-${slug}`} share="blog-open" default="none">
                {children}
            </ViewTransition>
        </Link>
    );
}
