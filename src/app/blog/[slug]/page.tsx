import { cacheLife, cacheTag } from "next/cache";
import {
    getBlog,
    getBlogMetadata,
    getPostBySlug,
    getAllPostsMeta,
    getSlugById,
} from "@/lib/notion";
import { CACHE_TAGS, getBlogTag } from "@/lib/cache-tags";
import NotionPageClient from "../_components/notion-page-client";
import "react-notion-x/src/styles.css";
import { type Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { type PageObjectResponse } from "@notionhq/client";
import SponsorCard from "@/components/sponser-card";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import { BREADCRUMB_SITE_URL } from "@/lib/breadcrumb-json-ld";
import { BlogPosting, WithContext } from "schema-dts";

export async function generateStaticParams() {
    // Prebuild slugs for ISR; if dataset is large, consider reducing this or relying on dynamic rendering.
    const metas = await getAllPostsMeta();
    return metas.map((m) => ({ slug: m.slug }));
}

type Props = {
    params: Promise<{ slug: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxiang.site";
const AUTHOR = "Chen Xiang";

/** Notion date properties are often YYYY-MM-DD; add UTC so schema gets a timezone. */
function normalizeNotionDateTime(value: string): string {
    const v = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return `${v}T00:00Z`;
    }
    return v;
}

function getPostDates(post: PageObjectResponse) {
    const publishedRaw =
        post.properties["Publish Date"]?.type === "date"
            ? (post.properties["Publish Date"].date?.start ?? post.created_time)
            : post.created_time;

    const modifiedRaw = post.last_edited_time ?? publishedRaw;

    return {
        publishedTime: normalizeNotionDateTime(publishedRaw),
        modifiedTime: normalizeNotionDateTime(modifiedRaw),
    };
}

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
              : "/images/default-og-image.jpg";

    const canonical = `${SITE_URL}/blog/${post.slug}`;
    const { publishedTime, modifiedTime } = getPostDates(response);

    return {
        title,
        description: abstract,
        authors: [{ name: AUTHOR, url: `${SITE_URL}/en` }],
        creator: AUTHOR,
        publisher: AUTHOR,
        alternates: {
            canonical,
        },
        openGraph: {
            type: "article",
            url: canonical,
            title,
            description: abstract,
            siteName: "Chen Xiang",
            images: [{ url: coverImage }],
            publishedTime,
            modifiedTime,
            authors: [AUTHOR],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description: abstract,
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

    cacheTag(CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, getBlogTag(resolved.id));
    const recordMap = await getBlog(resolved.id);

    if (!recordMap) {
        notFound();
    }

    const metadata = (await getBlogMetadata(resolved.id)) as PageObjectResponse;
    const title =
        (metadata?.properties.Title.type === "title" &&
            metadata.properties.Title.title[0]?.plain_text) ||
        resolved.title;
    const abstract =
        (metadata?.properties.Abstract.type === "rich_text" &&
            metadata.properties.Abstract.rich_text[0]?.plain_text) ||
        "Chen Xiang's personal blog, sharing thoughts and experiences.";
    const coverImage =
        metadata?.cover?.type === "external"
            ? metadata.cover.external.url
            : metadata?.cover?.type === "file"
              ? metadata.cover.file.url
              : "https://cdn.cxiang.site/default-og-image.jpg";
    const canonical = `${SITE_URL}/blog/${resolved.slug}`;
    const { publishedTime, modifiedTime } = getPostDates(metadata);

    const blogJsonLd: WithContext<BlogPosting> = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: abstract,
        url: canonical,
        mainEntityOfPage: canonical,
        image: coverImage,
        datePublished: publishedTime,
        dateModified: modifiedTime,
        author: {
            "@type": "Person",
            name: AUTHOR,
            url: `${SITE_URL}/en`,
        },
        publisher: {
            "@type": "Person",
            name: AUTHOR,
            url: `${SITE_URL}/en`,
        },
    };

    return (
        <div className="w-full h-full flex flex-col justify-start items-stretch">
            <BreadcrumbJsonLd
                entries={[
                    { name: "Home", item: BREADCRUMB_SITE_URL },
                    { name: "Blog", item: `${BREADCRUMB_SITE_URL}/blog` },
                    { name: title },
                ]}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(blogJsonLd),
                }}
            />
            <div className="h-12" />
            <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2">
                <NotionPageClient recordMap={recordMap} />
            </div>
            <div className="w-full flex justify-center">
                <SponsorCard />
            </div>
        </div>
    );
}
