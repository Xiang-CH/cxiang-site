import { isDatabaseConfigured } from "@/db";
import { getPublicBlogStats } from "@/lib/blog-stats";
import { BlogStats } from "./blog-stats";

export async function BlogStatsServer({
    slug,
    showSeparator = false,
}: {
    slug: string;
    showSeparator?: boolean;
}) {
    if (!isDatabaseConfigured()) return null;

    let stats: { views: number; likes: number };
    try {
        stats = (await getPublicBlogStats([slug]))[slug] ?? { views: 0, likes: 0 };
    } catch (error) {
        console.error("Unable to render blog statistics", error);
        return null;
    }

    return (
        <>
            {showSeparator && <span aria-hidden>·</span>}
            <BlogStats slug={slug} initialStats={stats} />
        </>
    );
}
