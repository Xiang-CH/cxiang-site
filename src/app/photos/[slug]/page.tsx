import { notFound } from "next/navigation";
import { cacheLife, cacheTag } from "next/cache";
import { type Metadata } from "next";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import { BREADCRUMB_SITE_URL } from "@/lib/breadcrumb-json-ld";
import { getPhotoSet, getPhotoSetSummaries } from "@/lib/photos";
import { createPageMetadata } from "@/lib/seo";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { formatShotRange } from "@/lib/shot-range";
import PhotoLightbox from "../_components/photo-lightbox";

/**
 * Reserved slug so the build never produces an empty `generateStaticParams`
 * when the database has no published collections.
 */
const BUILD_PLACEHOLDER_SLUG = "__build_placeholder__";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
    const sets = await getPhotoSetSummaries();
    if (sets.length === 0) {
        return [{ slug: BUILD_PLACEHOLDER_SLUG }];
    }
    return sets.map((set) => ({ slug: set.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const set = await getPhotoSet(slug);

    if (!set) {
        return createPageMetadata({
            title: "Photos",
            socialTitle: "Photos | Chen Xiang",
            description: "Photo collections by Chen Xiang.",
            pathname: `/photos/${slug}`,
        });
    }

    return createPageMetadata({
        title: set.title,
        socialTitle: `${set.title} | Chen Xiang`,
        description:
            set.abstract ??
            `${set.photoCount} photographs by Chen Xiang in the "${set.title}" collection.`,
        pathname: `/photos/${set.slug}`,
        ...(set.cover ? { images: [set.cover.src] } : {}),
    });
}

/** One collection: its photos laid out in the bento grid, with a viewer. */
export default async function PhotoSetPage({ params }: Props) {
    "use cache";
    // Tagged so a Studio save or delete invalidates the cached page itself.
    cacheLife("max");
    cacheTag(CACHE_TAGS.photos);
    const { slug } = await params;
    const set = await getPhotoSet(slug);

    if (!set) notFound();

    return (
        <>
            <BreadcrumbJsonLd
                entries={[
                    { name: "Home", item: BREADCRUMB_SITE_URL },
                    { name: "Photos", item: `${BREADCRUMB_SITE_URL}/photos` },
                    { name: set.title },
                ]}
            />
            <main className="mx-auto h-full w-full max-w-md py-6 sm:max-w-3xl lg:max-w-5xl">
                <header className="mb-5 flex flex-col gap-1">
                    <h1 className="text-xl font-[450]">{set.title}</h1>
                    {set.abstract ? (
                        <p className="text-sm font-[350] text-foreground/70">{set.abstract}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                        {[
                            formatShotRange(set),
                            `${set.photoCount} photo${set.photoCount === 1 ? "" : "s"}`,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                </header>
                <PhotoLightbox photos={set.photos} />
            </main>
        </>
    );
}
