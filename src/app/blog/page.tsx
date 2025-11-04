import { getBlogs, getAllPostsMeta, type PostMeta } from "@/lib/notion";
import { type PageObjectResponse } from "@notionhq/client";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 60; // Revalidate every 60 seconds

export const metadata: Metadata = {
    title: "Blog | Chen Xiang",
    description: "Chen Xiang's Blogs",
};

export default async function Blogs() {
    let response;
    let metas: PostMeta[] = [];
    try {
        response = await getBlogs();
        metas = await getAllPostsMeta();
    } catch (error) {
        console.error("Error fetching blogs:", error);
        return (
            <div className="w-full h-full flex flex-col justify-center items-center">
                <h1>Error</h1>
                <p>😭Something went wrong when retrieving blogs.</p>
            </div>
        );
    }
    // console.log(response)

    if (!response) {
        return (
            <div className="w-full h-full flex flex-col justify-center items-center">
                <h1>Error</h1>
                <p>😭Something went wrong when retrieving blogs.</p>
            </div>
        );
    } else if (response.results.length === 0) {
        return (
            <main className="w-full h-screen flex flex-col justify-center items-center">
                <h1>Blog</h1>
                <p>Coming soon...</p>
            </main>
        );
    }

    return (
        <main className="w-full max-w-xl h-full flex flex-col justify-start items-start px-6 mx-auto mt-8 gap-6">
            {/* <h1 className="text-xl font-bold mb-1">Blogs</h1>
            <p className="text-md mb-12 font-light">
                Things that I have figured out and thought worth sharing.
            </p>
             */}
            {response.results.map((item) => {
                if (item.object !== "page" || !("properties" in item)) return;
                const blog = item as PageObjectResponse;

                const slug = metas.find((m) => m.id === blog.id)?.slug || blog.id;

                return (
                    <Link
                        href={`/blog/${slug}`}
                        className="w-full flex justify-between items-center group"
                        key={blog.id}
                    >
                        <div className="flex flex-col gap-1 min-h-28 h-full justify-center">
                            <h2 className="text-xl font-semibold group-hover:underline text-wrap">
                                {blog.properties.Title?.type === "title" &&
                                    blog.properties.Title.title[0]?.plain_text}
                            </h2>
                            <p className="text-sm">
                                {blog.properties["Publish Date"]?.type === "date" &&
                                    blog.properties["Publish Date"]?.date?.start}
                            </p>
                            <p className="text-md">
                                {blog.properties.Abstract?.type === "rich_text" &&
                                    blog.properties.Abstract.rich_text[0]?.plain_text}
                            </p>
                        </div>
                        {blog.cover && (
                            <div className="ml-2.5">
                                <Image
                                    src={
                                        blog.cover?.type === "external"
                                            ? blog.cover.external.url
                                            : blog.cover.file.url
                                    }
                                    alt="blog cover"
                                    width={160}
                                    height={90}
                                    quality={60}
                                    className="rounded-md"
                                    priority
                                />
                            </div>
                        )}
                    </Link>
                );
            })}
        </main>
    );
}
