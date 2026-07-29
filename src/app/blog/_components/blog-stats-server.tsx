import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";
import { isDatabaseConfigured } from "@/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
    BLOG_STATS_VISITOR_COOKIE,
    getBlogLikeState,
    getPublicBlogStats,
    isBlogStatsConfigured,
    isVisitorId,
} from "@/lib/blog-stats";
import { BlogStats } from "./blog-stats";

/**
 * Loads cached public statistics for a blog post.
 *
 * @param slug - The blog post slug
 * @returns The blog post's view and like counts, zero counts when no statistics exist, or `null` if loading fails
 */
async function getCachedPublicBlogStats(slug: string) {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.blogStats);

    try {
        return (await getPublicBlogStats([slug]))[slug] ?? { views: 0, likes: 0 };
    } catch (error) {
        console.error("Unable to load cached blog statistics", error);
        return null;
    }
}

/**
 * Renders blog statistics and the current visitor's like state.
 *
 * @param showSeparator - Whether to render a separator before the statistics.
 * @returns The blog statistics component, or `null` when database access or statistics retrieval is unavailable.
 */
export async function BlogStatsServer({
    slug,
    showSeparator = false,
}: {
    slug: string;
    showSeparator?: boolean;
}) {
    if (!isDatabaseConfigured()) return null;

    const stats = await getCachedPublicBlogStats(slug);
    if (!stats) return null;

    const likesAvailable = isBlogStatsConfigured();
    const visitorId = likesAvailable
        ? (await cookies()).get(BLOG_STATS_VISITOR_COOKIE)?.value
        : undefined;
    let liked = false;
    if (likesAvailable && isVisitorId(visitorId)) {
        try {
            liked = await getBlogLikeState(slug, visitorId);
        } catch (error) {
            console.error("Unable to render blog like state", error);
        }
    }

    return (
        <>
            {showSeparator && <span aria-hidden>·</span>}
            <BlogStats
                key={slug}
                slug={slug}
                initialStats={stats}
                initialLiked={liked}
                likesAvailable={likesAvailable}
            />
        </>
    );
}
