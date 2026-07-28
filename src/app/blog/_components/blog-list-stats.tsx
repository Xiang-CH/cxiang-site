"use client";

import { Eye, Heart } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
    formatBlogLikeCount,
    formatBlogViewCount,
    getBlogViewCountLabel,
} from "@/lib/blog-stats-format";

type PublicBlogStats = {
    views: number;
    likes: number;
};

type BlogStatsResponse = {
    stats: Record<string, PublicBlogStats>;
};

const BlogListStatsContext = createContext<Record<string, PublicBlogStats>>({});

export function BlogListStatsProvider({
    slugs,
    children,
}: {
    slugs: string[];
    children: ReactNode;
}) {
    const [stats, setStats] = useState<Record<string, PublicBlogStats>>({});
    const slugKey = useMemo(() => [...new Set(slugs)].join("\u0000"), [slugs]);

    useEffect(() => {
        const uniqueSlugs = slugKey.split("\u0000").filter(Boolean);
        if (uniqueSlugs.length === 0) return;

        const controller = new AbortController();
        const params = new URLSearchParams();
        uniqueSlugs.forEach((slug) => params.append("slug", slug));

        async function loadStats() {
            try {
                const response = await fetch(`/api/blog-stats?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!response.ok) return;
                const payload = (await response.json()) as BlogStatsResponse;
                setStats(payload.stats);
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    console.error("Unable to load blog list statistics", error);
                }
            }
        }

        void loadStats();
        return () => controller.abort();
    }, [slugKey]);

    return <BlogListStatsContext.Provider value={stats}>{children}</BlogListStatsContext.Provider>;
}

export function BlogListStats({ slug, small }: { slug: string; small?: boolean }) {
    const stats = useContext(BlogListStatsContext)[slug];
    if (!stats) return null;

    return (
        <span
            className={`inline-flex items-center gap-2 ${small ? "text-xs" : "text-sm"} text-muted-foreground`}
            aria-label="Post engagement"
        >
            <span
                className="inline-flex items-center gap-1"
                title="Views"
                aria-label={getBlogViewCountLabel(stats.views)}
            >
                <Eye className={small ? "size-3" : "size-3.5"} aria-hidden />
                {formatBlogViewCount(stats.views)}
            </span>
            <span className="inline-flex items-center gap-1" title="Likes">
                <Heart className={small ? "size-3" : "size-3.5"} aria-hidden />
                {formatBlogLikeCount(stats.likes)}
            </span>
        </span>
    );
}
