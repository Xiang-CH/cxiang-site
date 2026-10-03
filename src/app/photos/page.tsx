import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import { BREADCRUMB_SITE_URL } from "@/lib/breadcrumb-json-ld";
import { getPhotoSetSummaries } from "@/lib/photos";
import { createPageMetadata } from "@/lib/seo";
import { formatShotRange } from "@/lib/shot-range";

export const metadata: Metadata = {
    ...createPageMetadata({
        title: "Photos",
        socialTitle: "Photos | Chen Xiang",
        description: "Photo collections by Chen Xiang — travel, street, and everyday frames.",
        pathname: "/photos",
    }),
};

/** Index of photo collections: one card per set, led by its cover photo. */
export default async function Photos() {
    "use cache";
    const sets = await getPhotoSetSummaries();

    if (sets.length === 0) {
        return (
            <>
                <BreadcrumbJsonLd
                    entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Photos" }]}
                />
                <main className="flex h-screen w-full flex-col items-center justify-center">
                    <h1>Photos</h1>
                    <p>Coming soon...</p>
                </main>
            </>
        );
    }

    return (
        <>
            <BreadcrumbJsonLd
                entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: "Photos" }]}
            />
            <main className="mx-auto h-full w-full max-w-md py-6 sm:max-w-3xl lg:max-w-5xl">
                <h1 className="sr-only">Photos</h1>
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {sets.map((set) => (
                        <li key={set.id}>
                            <Link
                                href={`/photos/${set.slug}`}
                                className="group flex flex-col overflow-hidden rounded-xl border bg-neutral-50/40 dark:bg-neutral-900"
                            >
                                {set.cover ? (
                                    <div className="overflow-hidden bg-gray-100 dark:bg-neutral-900">
                                        <Image
                                            src={set.cover.src}
                                            alt={set.cover.alt}
                                            width={set.cover.width}
                                            height={set.cover.height}
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            quality={50}
                                            className="h-auto w-full transition-transform duration-200 group-hover:scale-[1.01]"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex aspect-4/3 items-center justify-center bg-gray-100 text-sm text-muted-foreground dark:bg-neutral-900">
                                        No photos yet
                                    </div>
                                )}
                                <div className="flex flex-col gap-1 border-t px-4 py-3">
                                    <h2 className="text-base font-[450] group-hover:underline">
                                        {set.title}
                                    </h2>
                                    {set.abstract ? (
                                        <p className="line-clamp-2 text-sm font-[350] text-foreground/70">
                                            {set.abstract}
                                        </p>
                                    ) : null}
                                    <p className="text-xs text-muted-foreground">
                                        {[
                                            `${set.photoCount} photo${
                                                set.photoCount === 1 ? "" : "s"
                                            }`,
                                            formatShotRange(set),
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </main>
        </>
    );
}
