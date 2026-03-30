import { buildBreadcrumbListJsonLd, type BreadcrumbEntry } from "@/lib/breadcrumb-json-ld";

/** Server-rendered `application/ld+json` for [BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb). */
export default function BreadcrumbJsonLd({ entries }: { entries: BreadcrumbEntry[] }) {
    const jsonLd = buildBreadcrumbListJsonLd(entries);
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
