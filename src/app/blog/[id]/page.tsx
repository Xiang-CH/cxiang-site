import { getBlog, getBlogs, getBlogMetadata } from "@/lib/notion";
import NotionPageClient from "./notion-page-client";

// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css";
import { Metadata, ResolvingMetadata } from "next";
import { type PageObjectResponse } from "@notionhq/client";

// used for code syntax highlighting (optional)
// import 'prismjs/themes/prism.css'
// import 'prismjs/themes/prism-tomorrow.css'

// used for rendering equations (optional)
// import 'katex/dist/katex.min.css'

export const revalidate = 600;
export const dynamicParams = true;

export async function generateStaticParams() {
    const blogs = await getBlogs();
    return blogs.results.map((blog) => ({
        id: blog.id,
    }));
}

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const { id } = await params
    
    // fetch data
    const response = (await getBlogMetadata(id)) as PageObjectResponse;

    const title = response?.properties.Title.type === "title" && response?.properties.Title.title[0]?.plain_text || "Blog Post"
    const abstract = response?.properties.Abstract.type === "rich_text" && response?.properties.Abstract.rich_text[0]?.plain_text || "Chen Xiang's personal blog, sharing thoughts and experiences.";
    const coverImage = response?.cover?.type === "external" ? response.cover.external.url : response?.cover?.type === "file" ? response.cover.file.url : "/images/default-og-image.svg";
    
    return {
        title: title,
        description: abstract,
        openGraph: {
            type: "article",
            url: `https://www.cxiang.site/blog/${id}`,
            title: title,
            description: abstract,
            siteName: "CXiang's Blog",
            images: [{ url: coverImage }]
        },
    }
}

export default async function Blog({ params }: Props) {
    const { id } = await params;
    const response = await getBlog(id);

    // const response = null;
    // console.log(response)

    try {
        if (!response) {
            return (
                <main className="w-full h-full flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-bold mb-4">Not Found</h1>
                    <p>This blog post could not be found. {id}</p>
                </main>
            );
        }

        return (
            <main className="w-full h-full flex flex-col justify-start items-center">
                <NotionPageClient recordMap={response} />
            </main>
        );
    } catch (error) {
        console.error("Error fetching blog:", error);
        return (
            <main className="w-full h-full flex flex-col justify-center items-center">
                <h1 className="text-2xl font-bold mb-4">Error</h1>
                <p>😭 Something went wrong when retrieving the blog post.</p>
                <p className="text-sm text-gray-600 mt-2">
                    {error instanceof Error ? error.message : "Unknown error"}
                </p>
            </main>
        );
    }
}
