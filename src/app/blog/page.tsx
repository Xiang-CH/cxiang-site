import { cacheLife, cacheTag } from "next/cache";
import { getBlogs, getAllPostsMeta, type PostMeta } from "@/lib/notion";
import { type PageObjectResponse } from "@notionhq/client";
import { isDatabaseConfigured } from "@/db";
import { getPublicBlogStats, type PublicBlogStats } from "@/lib/blog-stats";
import { Metadata } from "next";
import Image from "next/image";
import { BlogListLink } from "./_components/blog-list-link";
import { BlogListStats } from "./_components/blog-list-stats";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import { BREADCRUMB_SITE_URL } from "@/lib/breadcrumb-json-ld";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
    ...createPageMetadata({
        title: "Blog",
        socialTitle: "Blog | Chen Xiang",
        description: "Writing by Chen Xiang on software, projects, lessons learned, and more.",
        pathname: "/blog",
    }),
};

/**
 * Renders the error state shown when blog data cannot be retrieved.
 */
function ErrorLoadingBlogs() {
    return (
        <>
            <BreadcrumbJsonLd
                entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Blog" }]}
            />
            <div className="w-full h-full flex flex-col justify-center items-center">
                <h1>Error</h1>
                <p>😭Something went wrong when retrieving blogs.</p>
            </div>
        </>
    );
}

/**
 * Retrieves public statistics for the specified blog slugs when the database is configured.
 *
 * @param slugs - The blog slugs whose statistics to retrieve
 * @returns A map of blog slugs to their public statistics, or an empty object when unavailable
 */
async function getServerBlogStats(slugs: string[]): Promise<Record<string, PublicBlogStats>> {
    if (!isDatabaseConfigured()) return {};

    try {
        return await getPublicBlogStats(slugs);
    } catch (error) {
        console.error("Unable to render blog list statistics", error);
        return {};
    }
}

/**
 * Renders the blog index page with available posts, metadata, and engagement statistics.
 *
 * @returns The blog listing page, an empty-state page when no posts are available, or an error page when loading fails.
 */
export default async function Blogs() {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, CACHE_TAGS.blogStats);

    let response;
    let metas: PostMeta[] = [];
    try {
        response = await getBlogs();
        metas = await getAllPostsMeta(response);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        return <ErrorLoadingBlogs />;
    }
    // console.log(response)

    if (!response) {
        return <ErrorLoadingBlogs />;
    } else if (response.results.length === 0) {
        return (
            <>
                <BreadcrumbJsonLd
                    entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Blog" }]}
                />
                <main className="w-full h-screen flex flex-col justify-center items-center">
                    <h1>Blog</h1>
                    <p>Coming soon...</p>
                </main>
            </>
        );
    }

    const statsBySlug = await getServerBlogStats(metas.map((meta) => meta.slug));

    return (
        <>
            <BreadcrumbJsonLd
                entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Blog" }]}
            />
            <main className="w-full max-w-2xl h-full flex flex-col justify-start items-start mx-auto pt-4 sm:pt-6 gap-9 px-1">
                <h1 className="sr-only">Blog</h1>
                {response.results.map((item) => {
                    if (item.object !== "page" || !("properties" in item)) return;
                    const blog = item as PageObjectResponse;
                    const title =
                        blog.properties.Title?.type === "title"
                            ? (blog.properties.Title.title[0]?.plain_text ?? "Untitled")
                            : "Untitled";

                    const slug = metas.find((m) => m.id === blog.id)?.slug || blog.id;

                    const coverSrc =
                        blog.cover?.type === "external"
                            ? blog.cover.external.url
                            : blog.cover?.type === "file"
                              ? blog.cover.file.url
                              : null;

                    return (
                        <BlogListLink
                            key={blog.id}
                            href={`/blog/${slug}`}
                            slug={slug}
                            coverPrefetchSrc={coverSrc}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex flex-col gap-1 h-full justify-center mt-1">
                                    <h2 className="text-md font-[450] group-hover:underline text-wrap leading-[1.3]">
                                        {title}
                                    </h2>
                                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                        {blog.properties["Publish Date"]?.type === "date" &&
                                            blog.properties["Publish Date"]?.date?.start}
                                        <BlogListStats stats={statsBySlug[slug]} small />
                                    </p>
                                    <p className="text-sm font-[350] text-foreground/70">
                                        {blog.properties.Abstract?.type === "rich_text" &&
                                            blog.properties.Abstract.rich_text[0]?.plain_text}
                                    </p>
                                </div>
                                {blog.cover && coverSrc && (
                                    <div className="min-w-28 max-w-28 sm:min-w-30 sm:max-w-30 mt-2">
                                        <Image
                                            src={coverSrc}
                                            alt={`${title} cover image`}
                                            width={160}
                                            height={90}
                                            quality={40}
                                            className="rounded-md w-full h-auto"
                                        />
                                    </div>
                                )}
                            </div>
                        </BlogListLink>
                    );
                })}
            </main>
        </>
    );
}
