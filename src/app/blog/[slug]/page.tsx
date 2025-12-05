import { cacheLife } from "next/cache";
import {
    getBlog,
    getBlogMetadata,
    getPostBySlug,
    getAllPostsMeta,
    getSlugById,
} from "@/lib/notion";
import NotionPageClient from "../_components/notion-page-client";
import "react-notion-x/src/styles.css";
import { type Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { type PageObjectResponse } from "@notionhq/client";

export async function generateStaticParams() {
    // Prebuild slugs for ISR; if dataset is large, consider reducing this or relying on dynamic rendering.
    const metas = await getAllPostsMeta();
    return metas.map((m) => ({ slug: m.slug }));
}

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const slug = (await params).slug;
    const post = await getPostBySlug(slug);

    if (!post) {
        // Let the page render a 404
        return {
            title: "Blog Post Not Found",
            description: "Chen Xiang's personal blog, sharing thoughts and experiences.",
        };
    }

    // If the incoming slug is historical, redirect in the page render. For metadata, use current slug.
    const id = post.id;
    const response = (await getBlogMetadata(id)) as PageObjectResponse;

    const title =
        (response?.properties.Title.type === "title" &&
            response?.properties.Title.title[0]?.plain_text) ||
        "Blog Post";
    const abstract =
        (response?.properties.Abstract.type === "rich_text" &&
            response?.properties.Abstract.rich_text[0]?.plain_text) ||
        "Chen Xiang's personal blog, sharing thoughts and experiences.";
    const coverImage =
        response?.cover?.type === "external"
            ? response.cover.external.url
            : response?.cover?.type === "file"
              ? response.cover.file.url
              : "/images/default-og-image.svg";

    const canonical = `https://www.cxiang.site/blog/${post.slug}`;

    return {
        title,
        description: abstract,
        alternates: {
            canonical,
        },
        openGraph: {
            type: "article",
            url: canonical,
            title,
            description: abstract,
            siteName: "Chen Xiang's Blog",
            images: [{ url: coverImage }],
        },
    };
}

export default async function BlogBySlug({ params }: Props) {
    "use cache";
    cacheLife("days");
    const slug = (await params).slug;

    // Legacy: if the path segment is actually an id, redirect to its canonical slug
    const legacySlug = await getSlugById(slug);
    if (legacySlug) {
        redirect(`/blog/${legacySlug}`);
    }

    const resolved = await getPostBySlug(slug);

    if (!resolved) {
        notFound();
    }

    // If the provided slug is a previous slug or otherwise not the current one, redirect to the canonical slug
    if (resolved.slug !== slug) {
        redirect(`/blog/${resolved.slug}`);
    }

    const recordMap = await getBlog(resolved.id);

    if (!recordMap) {
        notFound();
    }

    return (
        <main className="w-full h-full flex flex-col justify-start items-center">
            <NotionPageClient recordMap={recordMap} pageId={resolved.id} pageSlug={resolved.slug} />
        </main>
    );
}
