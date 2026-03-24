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
import { BuymeacoffeeIconColorBg } from "@/components/icons/buymeacoffee-icon";
import { AifadianIconColorBg } from "@/components/icons/aifadian-icon";

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
        <div className="w-full h-full flex flex-col justify-start items-center">
            <div className="h-12" />
            <NotionPageClient recordMap={recordMap} />
            {/* <div className="w-full max-w-3xl px-6 pb-4">
                <div className="mt-10 flex flex-wrap gap-3 rounded-lg border border-border p-6 text-sm text-muted-foreground items-center">
                    <p>If you liked this post, you can support me on:</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <a
                            href="https://buymeacoffee.com/cxiang"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            <BuymeacoffeeIcon size={18} color="currentColor" strokeWidth={0} />
                            Buy me a coffee
                        </a>
                        or
                        <a
                            href="https://ifdian.net/a/cxiangsite"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-[#ece6f8b6] dark:bg-primary px-4 py-2 text-sm font-medium text-[#946CE6] dark:text-[#8c5deb] transition-colors hover:bg-[#ece6f8b6]/80 dark:hover:bg-primary/90"
                        >
                            <AifadianIcon size={18} color="currentColor" />
                            爱发电
                        </a>
                    </div>
                </div>
            </div> */}
            <div className="w-full max-w-3xl px-6 pb-4">
                <div className="mt-10 flex flex-wrap gap-3 rounded-lg border border-border p-6 text-sm text-muted-foreground items-center">
                    <p>If you liked this post, you can support me by:</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <a
                            href="https://buymeacoffee.com/cxiang"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <BuymeacoffeeIconColorBg />
                        </a>
                        or
                        <a
                            href="https://ifdian.net/a/cxiangsite"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg"
                        >
                            <AifadianIconColorBg />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
