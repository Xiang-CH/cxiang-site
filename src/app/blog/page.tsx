import { getBlogs } from "@/lib/notion";
import { type PageObjectResponse } from "@notionhq/client";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Blogs() {
    let response;
    try {
        response = await getBlogs();
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
                <h1>Blogs</h1>
                <p>Coming soon...</p>
            </main>
        );
    }

    return (
        <main className="w-full max-w-xl h-full flex flex-col justify-start items-start px-6 mx-auto mt-12">
            {response.results.map((item) => {
                if (item.object !== "page" || !("properties" in item)) return;
                const blog = item as PageObjectResponse;

                return (
                    <Link
                        href={`/blogs/${blog.id}`}
                        className="w-full flex justify-between items-center group"
                        key={blog.id}
                    >
                        <div className="flex flex-col gap-2 min-h-32 h-full justify-center">
                            <h1 className="text-lg font-semibold leading-5 group-hover:underline text-wrap max-w-full">
                                {blog.properties.Title.type === "title" &&
                                    blog.properties.Title.title[0]?.plain_text}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {blog.properties["Publish Date"]?.type === "date" &&
                                    blog.properties["Publish Date"]?.date?.start}
                            </p>
                        </div>
                        {blog.cover && (
                            <div className="ml-2">
                                <Image
                                    src={
                                        blog.cover.type === "external"
                                            ? blog.cover.external.url
                                            : blog.cover.file.url
                                    }
                                    alt="blog cover"
                                    width={200}
                                    height={100}
                                    className="rounded-md"
                                />
                            </div>
                        )}
                    </Link>
                );
            })}
        </main>
    );
}
