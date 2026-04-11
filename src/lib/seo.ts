import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxiang.site").replace(
    /\/$/,
    ""
);
export const SITE_NAME = "Chen Xiang 陈想";
export const SITE_AUTHOR = "Chen Xiang";
export const SITE_PUBLISHER = "CXiang Site";
export const SITE_ALTERNATE_NAMES = ["cxiang.site", "陈想", "CXiang", "Chen Xiang"];
export const DEFAULT_OG_IMAGE = "https://cdn.cxiang.site/default-og-image.jpg";
export const DEFAULT_SITE_DESCRIPTION =
    "Personal website of Chen Xiang, featuring full-stack software engineering projects, experience, and technical writing.";
export const BLOG_DESCRIPTION_FALLBACK = "Technical writing by Chen Xiang.";

export function absoluteUrl(pathname: string): string {
    return new URL(pathname, SITE_URL).toString();
}

export function getLocalePath(locale: string): string {
    return locale === "en" ? "/" : `/${locale}`;
}

export function getLocaleAlternateUrls(): Record<string, string> {
    return {
        en: absoluteUrl("/"),
        "zh-CN": absoluteUrl("/zh-CN"),
        "x-default": absoluteUrl("/"),
    };
}

type CreatePageMetadataParams = {
    title?: string;
    socialTitle?: string;
    description: string;
    pathname: string;
    includeLocaleAlternates?: boolean;
    openGraphType?: "website" | "article";
    images?: string[];
    publishedTime?: string;
    modifiedTime?: string;
    articleAuthors?: string[];
};

export function createPageMetadata({
    title,
    socialTitle = title,
    description,
    pathname,
    includeLocaleAlternates = false,
    openGraphType = "website",
    images = [DEFAULT_OG_IMAGE],
    publishedTime,
    modifiedTime,
    articleAuthors,
}: CreatePageMetadataParams): Metadata {
    const canonical = absoluteUrl(pathname);

    const openGraph: NonNullable<Metadata["openGraph"]> =
        openGraphType === "article"
            ? {
                  type: "article",
                  title: socialTitle,
                  description,
                  url: canonical,
                  siteName: SITE_NAME,
                  images: images.map((url) => ({ url })),
                  publishedTime,
                  modifiedTime,
                  authors: articleAuthors,
              }
            : {
                  type: "website",
                  title: socialTitle,
                  description,
                  url: canonical,
                  siteName: SITE_NAME,
                  images: images.map((url) => ({ url })),
              };

    return {
        ...(title ? { title } : {}),
        description,
        authors: [{ name: SITE_AUTHOR, url: absoluteUrl("/") }],
        creator: SITE_AUTHOR,
        publisher: SITE_PUBLISHER,
        alternates: {
            canonical,
            ...(includeLocaleAlternates ? { languages: getLocaleAlternateUrls() } : {}),
        },
        openGraph,
        twitter: {
            card: "summary_large_image",
            title: socialTitle,
            description,
            images,
        },
    };
}
