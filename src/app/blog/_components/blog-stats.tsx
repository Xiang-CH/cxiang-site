"use client";

import { Eye, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    formatBlogLikeCount,
    formatBlogViewCount,
    getBlogViewCountLabel,
} from "@/lib/blog-stats-format";

type PublicBlogStats = {
    views: number;
    likes: number;
};

type BlogStats = PublicBlogStats & {
    liked: boolean;
};

export function BlogStats({ slug }: { slug: string }) {
    const [publicStats, setPublicStats] = useState<PublicBlogStats | null>(null);
    const [liked, setLiked] = useState<boolean | null>(null);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setPublicStats(null);
        setLiked(null);

        async function recordView(): Promise<BlogStats | null> {
            try {
                const response = await fetch(`/api/blog-stats/${encodeURIComponent(slug)}/view`, {
                    method: "POST",
                    cache: "no-store",
                    credentials: "same-origin",
                    signal: controller.signal,
                });
                if (!response.ok) return null;
                return (await response.json()) as BlogStats;
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    console.error("Unable to load blog statistics", error);
                }
                return null;
            }
        }

        async function loadPublicStats(fallback: PublicBlogStats) {
            const params = new URLSearchParams({ slug });
            try {
                const response = await fetch(`/api/blog-stats?${params.toString()}`, {
                    signal: controller.signal,
                });
                if (!response.ok) return;
                const payload = (await response.json()) as {
                    stats: Record<string, PublicBlogStats>;
                };
                const stats = payload.stats[slug];
                setPublicStats(stats ?? fallback);
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    console.error("Unable to load public blog statistics", error);
                }
                setPublicStats(fallback);
            }
        }

        async function loadStats() {
            const recordedStats = await recordView();
            if (!recordedStats) return;

            setLiked(recordedStats.liked);
            await loadPublicStats({ views: recordedStats.views, likes: recordedStats.likes });
        }

        void loadStats();
        return () => controller.abort();
    }, [slug]);

    async function toggleLike() {
        if (!publicStats || liked === null || isLiking) return;

        const previousStats = publicStats;
        const previousLiked = liked;
        const optimisticStats = {
            ...previousStats,
            likes: Math.max(0, previousStats.likes + (previousLiked ? -1 : 1)),
        };

        setIsLiking(true);
        setPublicStats(optimisticStats);
        setLiked(!previousLiked);

        try {
            const response = await fetch(`/api/blog-stats/${encodeURIComponent(slug)}/like`, {
                method: "POST",
                cache: "no-store",
                credentials: "same-origin",
            });
            if (!response.ok) throw new Error("Unable to update blog like");
            const stats = (await response.json()) as BlogStats;
            setPublicStats({ views: stats.views, likes: stats.likes });
            setLiked(stats.liked);
        } catch (error) {
            console.error("Unable to update blog like", error);
            setPublicStats(previousStats);
            setLiked(previousLiked);
        } finally {
            setIsLiking(false);
        }
    }

    if (!publicStats || liked === null) return null;

    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                className="inline-flex items-center gap-1 text-muted-foreground"
                title="Views"
                aria-label={getBlogViewCountLabel(publicStats.views)}
            >
                <Eye className="size-3.5" aria-hidden />
                {formatBlogViewCount(publicStats.views)}
            </span>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                aria-label={liked ? "Unlike this post" : "Like this post"}
                aria-pressed={liked}
                disabled={isLiking}
                onClick={toggleLike}
            >
                <Heart
                    className={liked ? "size-3.5 fill-current text-foreground" : "size-3.5"}
                    aria-hidden
                />
                {formatBlogLikeCount(publicStats.likes)}
            </Button>
        </span>
    );
}
