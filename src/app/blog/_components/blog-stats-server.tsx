import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";
import { isDatabaseConfigured } from "@/db";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
    BLOG_STATS_VISITOR_COOKIE,
    getBlogLikeState,
    getPublicBlogStats,
    isVisitorId,
} from "@/lib/blog-stats";
import { BlogStats } from "./blog-stats";

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

    const visitorId = (await cookies()).get(BLOG_STATS_VISITOR_COOKIE)?.value;
    let liked = false;
    if (isVisitorId(visitorId)) {
        try {
            liked = await getBlogLikeState(slug, visitorId);
        } catch (error) {
            console.error("Unable to render blog like state", error);
        }
    }

    return (
        <>
            {showSeparator && <span aria-hidden>·</span>}
            <BlogStats slug={slug} initialStats={stats} initialLiked={liked} />
        </>
    );
}
