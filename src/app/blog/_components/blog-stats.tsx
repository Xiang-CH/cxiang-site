"use client";

import { Eye, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BlogStats = {
    views: number;
    likes: number;
    liked: boolean;
};

function formatCount(value: number) {
    return new Intl.NumberFormat().format(value);
}

export function BlogStats({ slug }: { slug: string }) {
    const [stats, setStats] = useState<BlogStats | null>(null);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function loadStats() {
            try {
                const response = await fetch(`/api/blog-stats/${encodeURIComponent(slug)}/view`, {
                    method: "POST",
                    cache: "no-store",
                    credentials: "same-origin",
                    signal: controller.signal,
                });
                if (!response.ok) return;
                setStats((await response.json()) as BlogStats);
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    console.error("Unable to load blog statistics", error);
                }
            }
        }

        void loadStats();
        return () => controller.abort();
    }, [slug]);

    async function toggleLike() {
        if (!stats || isLiking) return;

        const previousStats = stats;
        const optimisticStats = {
            ...previousStats,
            liked: !previousStats.liked,
            likes: Math.max(0, previousStats.likes + (previousStats.liked ? -1 : 1)),
        };

        setIsLiking(true);
        setStats(optimisticStats);

        try {
            const response = await fetch(`/api/blog-stats/${encodeURIComponent(slug)}/like`, {
                method: "POST",
                cache: "no-store",
                credentials: "same-origin",
            });
            if (!response.ok) throw new Error("Unable to update blog like");
            setStats((await response.json()) as BlogStats);
        } catch (error) {
            console.error("Unable to update blog like", error);
            setStats(previousStats);
        } finally {
            setIsLiking(false);
        }
    }

    if (!stats) return null;

    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-muted-foreground" title="Views">
                <Eye className="size-3.5" aria-hidden />
                {formatCount(stats.views)}
            </span>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                aria-label={stats.liked ? "Unlike this post" : "Like this post"}
                aria-pressed={stats.liked}
                disabled={isLiking}
                onClick={toggleLike}
            >
                <Heart
                    className={stats.liked ? "size-3.5 fill-current text-foreground" : "size-3.5"}
                    aria-hidden
                />
                {formatCount(stats.likes)}
            </Button>
        </span>
    );
}
