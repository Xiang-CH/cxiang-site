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
import { type ExtendedRecordMap } from "notion-types";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import { BREADCRUMB_SITE_URL } from "@/lib/breadcrumb-json-ld";
import { BlogPosting, WithContext } from "schema-dts";
import { cache } from "react";
import {
    BLOG_DESCRIPTION_FALLBACK,
    SITE_AUTHOR,
    SITE_NAME,
    absoluteUrl,
    createPageMetadata,
} from "@/lib/seo";

export async function generateStaticParams() {
    // Prebuild slugs for ISR; if dataset is large, consider reducing this or relying on dynamic rendering.
    const metas = await getAllPostsMeta();
    return metas.map((m) => ({ slug: m.slug }));
}

type Props = {
    params: Promise<{ slug: string }>;
};

const META_DESCRIPTION_MAX_LENGTH = 160;

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

function toMetaDescription(text: string, maxLength = META_DESCRIPTION_MAX_LENGTH): string {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return BLOG_DESCRIPTION_FALLBACK;
    if (normalized.length <= maxLength) return normalized;

    const clipped = normalized.slice(0, maxLength - 3);
    const safe = clipped.slice(0, clipped.lastIndexOf(" ")).trim();
    return `${safe || clipped}...`;
}

type NotionTextLikeBlock = {
    properties?: {
        title?: unknown;
    };
};

function getBlockValue(
    box: ExtendedRecordMap["block"][string] | undefined
): NotionTextLikeBlock | undefined {
    if (!box) return undefined;

    const candidate = box.value as {
        value?: NotionTextLikeBlock;
        properties?: NotionTextLikeBlock["properties"];
    };
    if (candidate && "value" in candidate && candidate.value) {
        return candidate.value;
    }

    return box.value as NotionTextLikeBlock;
}

function getTitleTextFromRecordMap(recordMap: ExtendedRecordMap): string {
    const blocks = Object.values(recordMap.block || {});
    for (const blockBox of blocks) {
        const block = getBlockValue(blockBox);
        const titleDecorations = block?.properties?.title;
        if (!Array.isArray(titleDecorations) || titleDecorations.length === 0) continue;

        const title = titleDecorations
            .map((segment) =>
                Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""
            )
            .join("")
            .trim();

        if (title.length > 0) return title;
    }

    return "";
}

function getExcerptFromRecordMap(recordMap: ExtendedRecordMap): string {
    const snippets: string[] = [];
    let seenChars = 0;

    for (const blockBox of Object.values(recordMap.block || {})) {
        const block = getBlockValue(blockBox);
        const titleDecorations = block?.properties?.title;
        if (!Array.isArray(titleDecorations) || titleDecorations.length === 0) continue;

        const text = titleDecorations
            .map((segment) =>
                Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""
            )
            .join("")
            .replace(/\s+/g, " ")
            .trim();

        if (!text) continue;

        snippets.push(text);
        seenChars += text.length + 1;
        if (seenChars >= META_DESCRIPTION_MAX_LENGTH * 2) break;
    }

    return toMetaDescription(snippets.join(" "));
}

const getPostSeoData = cache(async (slug: string) => {
    const post = await getPostBySlug(slug);
    if (!post) {
        return null;
    }

    const [recordMap, notionPage] = await Promise.all([
        getBlog(post.id),
        getBlogMetadata(post.id) as Promise<PageObjectResponse>,
    ]);

    if (!recordMap) {
        return null;
    }

    const title =
        (notionPage?.properties.Title.type === "title" &&
            notionPage.properties.Title.title[0]?.plain_text) ||
        post.title ||
        getTitleTextFromRecordMap(recordMap) ||
        "Blog Post";

    const notionAbstract =
        notionPage?.properties.Abstract.type === "rich_text"
            ? notionPage.properties.Abstract.rich_text[0]?.plain_text || ""
            : "";

    const description = notionAbstract
        ? toMetaDescription(notionAbstract)
        : getExcerptFromRecordMap(recordMap);

    const coverImage =
        notionPage?.cover?.type === "external"
            ? notionPage.cover.external.url
            : notionPage?.cover?.type === "file"
              ? notionPage.cover.file.url
              : "https://cdn.cxiang.site/default-og-image.jpg";

    const { publishedTime, modifiedTime } = getPostDates(notionPage);

    return {
        post,
        recordMap,
        notionPage,
        title,
        description,
        coverImage,
        publishedTime,
        modifiedTime,
    };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const slug = (await params).slug;
    const seoData = await getPostSeoData(slug);

    if (!seoData) {
        // Let the page render a 404
        return createPageMetadata({
            title: "Blog Post Not Found",
            description: BLOG_DESCRIPTION_FALLBACK,
            pathname: "/blog",
        });
    }

    return createPageMetadata({
        title: seoData.title,
        description: seoData.description,
        pathname: `/blog/${seoData.post.slug}`,
        openGraphType: "article",
        images: [seoData.coverImage],
        publishedTime: seoData.publishedTime,
        modifiedTime: seoData.modifiedTime,
        articleAuthors: [SITE_AUTHOR],
    });
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

    const seoData = await getPostSeoData(slug);
    if (!seoData) {
        notFound();
    }

    // If the provided slug is a previous slug or otherwise not the current one, redirect to the canonical slug
    if (seoData.post.slug !== slug) {
        redirect(`/blog/${seoData.post.slug}`);
    }

    cacheTag(CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, getBlogTag(seoData.post.id));
    const canonical = absoluteUrl(`/blog/${seoData.post.slug}`);

    const blogJsonLd: WithContext<BlogPosting> = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: seoData.title,
        description: seoData.description,
        url: canonical,
        mainEntityOfPage: canonical,
        image: seoData.coverImage,
        datePublished: seoData.publishedTime,
        dateModified: seoData.modifiedTime,
        author: {
            "@type": "Person",
            name: SITE_AUTHOR,
            url: absoluteUrl("/"),
        },
        publisher: {
            "@type": "Person",
            name: SITE_NAME,
            url: absoluteUrl("/"),
        },
    };

    return (
        <div className="w-full h-full flex flex-col justify-start items-stretch">
            <BreadcrumbJsonLd
                entries={[
                    { name: "Home", item: BREADCRUMB_SITE_URL },
                    { name: "Blog", item: `${BREADCRUMB_SITE_URL}/blog` },
                    { name: seoData.title },
                ]}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(blogJsonLd),
                }}
            />
            <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2">
                <NotionPageClient
                    recordMap={seoData.recordMap}
                    publishDate={seoData.publishedTime}
                />
            </div>
        </div>
    );
}
