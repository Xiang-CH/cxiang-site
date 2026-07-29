import { Eye, Heart } from "lucide-react";
import {
    formatBlogLikeCount,
    formatBlogViewCount,
    getBlogViewCountLabel,
} from "@/lib/blog-stats-format";

type PublicBlogStats = {
    views: number;
    likes: number;
};

/**
 * Displays formatted view and like counts for a blog post.
 *
 * @param stats - The post's view and like counts; when omitted, no content is rendered.
 * @param small - Whether to use the compact text and icon sizing.
 */
export function BlogListStats({ stats, small }: { stats?: PublicBlogStats; small?: boolean }) {
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
            <span
                className="inline-flex items-center gap-1"
                title="Likes"
                aria-label={`${stats.likes} likes`}
            >
                <Heart className={small ? "size-3" : "size-3.5"} aria-hidden />
                {formatBlogLikeCount(stats.likes)}
            </span>
        </span>
    );
}
