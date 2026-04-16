import { cacheLife, cacheTag } from "next/cache";
import { getBlogs, getAllPostsMeta, type PostMeta } from "@/lib/notion";
import { type PageObjectResponse } from "@notionhq/client";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

export default async function Blogs() {
    "use cache";
    cacheLife("max");
    cacheTag(CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs);

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

                    return (
                        <Link
                            href={`/blog/${slug}`}
                            className="w-full items-center group"
                            key={blog.id}
                        >
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex flex-col gap-1 h-full justify-center mt-1">
                                    <h2 className="text-lg sm:text-xl font-[550] group-hover:underline text-wrap leading-[1.3]">
                                        {title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {blog.properties["Publish Date"]?.type === "date" &&
                                            blog.properties["Publish Date"]?.date?.start}
                                    </p>
                                    <p className="text-md font-[350]">
                                        {blog.properties.Abstract?.type === "rich_text" &&
                                            blog.properties.Abstract.rich_text[0]?.plain_text}
                                    </p>
                                </div>
                                {blog.cover && (
                                    <div className="min-w-28 max-w-28 sm:min-w-40 sm:max-w-40 mt-2">
                                        <Image
                                            src={
                                                blog.cover?.type === "external"
                                                    ? blog.cover.external.url
                                                    : blog.cover.file.url
                                            }
                                            alt={`${title} cover image`}
                                            width={160}
                                            height={90}
                                            quality={40}
                                            className="rounded-md w-full h-auto"
                                        />
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </main>
        </>
    );
}
