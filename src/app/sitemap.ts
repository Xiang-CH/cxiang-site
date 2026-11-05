import type { MetadataRoute } from "next";
import { type PageObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getAllPostsMeta, getProjects } from "@/lib/notion";
import { getPhotoSetSummaries } from "@/lib/photos";
import { getShotMonthStart } from "@/lib/shot-range";
import { routing } from "@/i18n/routing";
import { absoluteUrl, getLocaleAlternateUrls, getLocalePath } from "@/lib/seo";

function toValidDate(value: string | Date | undefined): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

function latestDate(values: Array<string | Date | undefined>): Date {
    const dates = values
        .map((value) => toValidDate(value))
        .filter((value): value is Date => Boolean(value));

    if (dates.length === 0) {
        return new Date();
    }

    return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function getProjectLastModified(project: PageObjectResponse): Date | undefined {
    const dateProp = project.properties?.Date;
    if (dateProp?.type === "date" && dateProp.date?.start) {
        return toValidDate(dateProp.date.start);
    }

    return toValidDate(project.last_edited_time ?? project.created_time);
}

function getLocaleAlternates() {
    return getLocaleAlternateUrls();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    "use cache";
    cacheLife("max");
    cacheTag(
        CACHE_TAGS.sitemap,
        CACHE_TAGS.blogs,
        CACHE_TAGS.blogSlugs,
        CACHE_TAGS.projects,
        CACHE_TAGS.photos
    );
    const [postsResult, projectsResult, photosResult] = await Promise.allSettled([
        getAllPostsMeta(),
        getProjects(),
        getPhotoSetSummaries(),
    ]);

    const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
    const projects = projectsResult.status === "fulfilled" ? projectsResult.value.results : [];
    const photoSets = photosResult.status === "fulfilled" ? photosResult.value : [];

    const blogLastModified = latestDate(posts.map((post) => post.date));
    const projectLastModified = latestDate(
        projects.flatMap((item) =>
            item.object === "page" && "properties" in item
                ? [getProjectLastModified(item as PageObjectResponse)]
                : []
        )
    );
    const photosLastModified = latestDate(photoSets.map((set) => getShotMonthStart(set)));
    const siteLastModified = latestDate([
        blogLastModified,
        projectLastModified,
        photosLastModified,
    ]);
    const homeAlternates = getLocaleAlternates();

    const sitemapEntries: MetadataRoute.Sitemap = [
        ...routing.locales.map((locale) => ({
            url: absoluteUrl(getLocalePath(locale)),
            lastModified: siteLastModified,
            changeFrequency: "monthly" as const,
            priority: 1,
            alternates: {
                languages: homeAlternates,
            },
        })),
        {
            url: absoluteUrl("/blog"),
            lastModified: blogLastModified,
            changeFrequency: "monthly" as const,
            priority: 0.8,
        },
        {
            url: absoluteUrl("/project"),
            lastModified: projectLastModified,
            changeFrequency: "monthly" as const,
            priority: 0.8,
        },
        {
            url: absoluteUrl("/photos"),
            lastModified: photosLastModified,
            changeFrequency: "monthly" as const,
            priority: 0.8,
        },
        ...posts.map((post) => ({
            url: absoluteUrl(`/blog/${post.slug}`),
            lastModified: toValidDate(post.date),
            changeFrequency: "never" as const,
            priority: 0.7,
        })),
        ...photoSets.map((set) => ({
            url: absoluteUrl(`/photos/${set.slug}`),
            lastModified: toValidDate(getShotMonthStart(set)),
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })),
    ];

    return sitemapEntries;
}
