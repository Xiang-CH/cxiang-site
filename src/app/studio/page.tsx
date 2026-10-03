import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isStudioAuthorizedCookie, isStudioEnabled, studioCookieName } from "@/lib/studio-auth";
import { listPhotoSets } from "@/lib/studio";
import StudioLogin from "./studio-login";

/**
 * Studio index.
 *
 * The cookie check lives inside a `<Suspense>` boundary because Cache Components
 * otherwise prerenders the whole route at build time, which would bake one
 * request's auth result into static HTML.
 */
export default function StudioPage() {
    return (
        <Suspense fallback={<StudioLoading />}>
            <StudioContent />
        </Suspense>
    );
}

function StudioLoading() {
    return <p className="text-sm text-muted-foreground">Loading Studio…</p>;
}

async function StudioContent() {
    if (!isStudioEnabled()) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
                <h1 className="text-lg font-[450]">Studio is disabled</h1>
                <p className="max-w-md text-sm text-muted-foreground">
                    Set <code className="font-mono">STUDIO_PASSWORD</code> in the environment to
                    enable it. Without a password it is only available during local development.
                </p>
            </div>
        );
    }

    const cookieStore = await cookies();
    if (!isStudioAuthorizedCookie(cookieStore.get(studioCookieName())?.value)) {
        return <StudioLogin passwordRequired={Boolean(process.env.STUDIO_PASSWORD)} />;
    }

    const sets = await listPhotoSets();

    return (
        <div className="flex flex-col gap-6">
            <header className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-[450]">Studio</h1>
                    <p className="text-sm text-muted-foreground">
                        {sets.length} photo collection{sets.length === 1 ? "" : "s"}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/studio/new">New collection</Link>
                </Button>
            </header>

            {sets.length === 0 ? (
                <p className="rounded-xl border p-6 text-sm text-muted-foreground">
                    No collections yet. Create one, upload photos, then arrange them in the grid.
                </p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {sets.map((set) => (
                        <li
                            key={set.id}
                            className="flex items-center justify-between gap-4 rounded-xl border p-4"
                        >
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/studio/${set.id}`}
                                        className="truncate font-[450] hover:underline"
                                    >
                                        {set.title}
                                    </Link>
                                    {set.published ? (
                                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                            Published
                                        </span>
                                    ) : (
                                        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                            Draft
                                        </span>
                                    )}
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                    /photos/{set.slug} · {set.photoCount} photo
                                    {set.photoCount === 1 ? "" : "s"}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/photos/${set.slug}`} target="_blank">
                                        View
                                    </Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={`/studio/${set.id}`}>Edit</Link>
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
