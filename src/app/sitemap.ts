import type { MetadataRoute } from "next";
import { type PageObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getAllPostsMeta, getProjects } from "@/lib/notion";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxiang.site";

function absoluteUrl(pathname: string) {
    return new URL(pathname, SITE_URL).toString();
}

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
    return getLocalizedAlternates("/");
}

function getLocalizedAlternates(pathname: string) {
    return Object.fromEntries(
        routing.locales.map((locale) => [
            locale,
            absoluteUrl(`/${locale}${pathname === "/" ? "" : pathname}`),
        ])
    ) as Record<string, string>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    "use cache";
    cacheLife("days");
    cacheTag(CACHE_TAGS.sitemap, CACHE_TAGS.blogs, CACHE_TAGS.blogSlugs, CACHE_TAGS.projects);
    const [postsResult, projectsResult] = await Promise.allSettled([
        getAllPostsMeta(),
        getProjects(),
    ]);

    const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
    const projects = projectsResult.status === "fulfilled" ? projectsResult.value.results : [];

    const blogLastModified = latestDate(posts.map((post) => post.date));
    const projectLastModified = latestDate(
        projects.flatMap((item) =>
            item.object === "page" && "properties" in item
                ? [getProjectLastModified(item as PageObjectResponse)]
                : []
        )
    );
    const siteLastModified = latestDate([blogLastModified, projectLastModified]);
    const homeAlternates = getLocaleAlternates();

    const sitemapEntries: MetadataRoute.Sitemap = [
        ...routing.locales.map((locale) => ({
            url: absoluteUrl(`/${locale}`),
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
        ...posts.map((post) => ({
            url: absoluteUrl(`/blog/${post.slug}`),
            lastModified: toValidDate(post.date),
            changeFrequency: "never" as const,
            priority: 0.7,
        })),
    ];

    return sitemapEntries;
}
