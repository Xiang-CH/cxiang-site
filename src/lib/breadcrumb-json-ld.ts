import type { BreadcrumbList, ListItem, WithContext } from "schema-dts";

/** Canonical site origin, no trailing slash (for `item` URLs). */
export const BREADCRUMB_SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cxiang.site"
).replace(/\/$/, "");

export type BreadcrumbEntry = {
    name: string;
    /** Omit on the last crumb for the current page; Google uses the page URL ([docs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)). */
    item?: string;
};

/** JSON-LD `BreadcrumbList` matching Google’s static JSON-LD shape. */
export function buildBreadcrumbListJsonLd(entries: BreadcrumbEntry[]): WithContext<BreadcrumbList> {
    const itemListElement: ListItem[] = entries.map((entry, index) => {
        const base = {
            "@type": "ListItem" as const,
            position: index + 1,
            name: entry.name,
        };
        if (entry.item !== undefined) {
            return { ...base, item: entry.item };
        }
        return base;
    });

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement,
    };
}
