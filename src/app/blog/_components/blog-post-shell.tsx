"use client";

import { ViewTransition } from "react";

export function BlogPostShell({ slug, children }: { slug: string; children: React.ReactNode }) {
    return (
        <ViewTransition name={`blog-${slug}`} share="blog-open" default="none">
            {children}
        </ViewTransition>
    );
}
