import { getBlog, getBlogs } from "@/lib/notion";
import NotionPageClient from "./notion-page-client";

// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css";

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

export default async function Blog({ params }: { params: Promise<{ id: string }> }) {
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
