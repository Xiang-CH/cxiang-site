"use client";

import { Eye, Heart } from "lucide-react";
import { useState } from "react";
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

/**
 * Displays blog view and like counts with an interactive like toggle.
 *
 * @param slug - The blog post identifier used for like updates.
 * @param initialStats - The initial view and like counts.
 * @param initialLiked - Whether the current user initially likes the post.
 */
export function BlogStats({
    slug,
    initialStats,
    initialLiked,
    likesAvailable,
}: {
    slug: string;
    initialStats: PublicBlogStats;
    initialLiked: boolean;
    likesAvailable: boolean;
}) {
    const [publicStats, setPublicStats] = useState(initialStats);
    const [liked, setLiked] = useState(initialLiked);
    const [isLiking, setIsLiking] = useState(false);

    async function toggleLike() {
        if (!likesAvailable || isLiking) return;

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
                aria-label={
                    likesAvailable
                        ? liked
                            ? "Unlike this post"
                            : "Like this post"
                        : "Likes are unavailable"
                }
                aria-pressed={likesAvailable && liked}
                disabled={!likesAvailable || isLiking}
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
