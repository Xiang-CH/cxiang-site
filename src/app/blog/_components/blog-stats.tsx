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

export function BlogStats({ slug, initialStats }: { slug: string; initialStats: PublicBlogStats }) {
    const [publicStats, setPublicStats] = useState(initialStats);
    const [liked, setLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function recordView() {
            try {
                const response = await fetch(`/api/blog-stats/${encodeURIComponent(slug)}/view`, {
                    method: "POST",
                    cache: "no-store",
                    credentials: "same-origin",
                    signal: controller.signal,
                });
                if (!response.ok) return;
                const stats = (await response.json()) as BlogStats;
                setLiked(stats.liked);
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    console.error("Unable to load blog statistics", error);
                }
            }
        }

        void recordView();
        return () => controller.abort();
    }, [slug]);

    async function toggleLike() {
        if (isLiking) return;

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

    return (
        <span className="inline-flex items-center gap-1">
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
