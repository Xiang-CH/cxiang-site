import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getPhotoSetForEditing } from "@/lib/studio";
import { isStudioAuthorizedCookie, isStudioEnabled, studioCookieName } from "@/lib/studio-auth";
import PhotosetEditor from "../_components/photoset-editor";

/**
 * Reserved id so the build has one param to prerender even though editors are
 * only reachable for real photoset ids (mirrors the blog route's placeholder).
 */
const BUILD_PLACEHOLDER_ID = "__build_placeholder__";

export function generateStaticParams() {
    return [{ id: BUILD_PLACEHOLDER_ID }];
}

/**
 * Editor for an existing photoset, drafts included.
 *
 * `params` is awaited before the boundary and passed down as a plain string; a
 * promise crossing `<Suspense>` counts as uncached data. The auth check and the
 * database read stay inside the boundary so one request's result is never baked
 * into a shared shell.
 */
export default async function EditPhotoSetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading editor…</p>}>
            <EditPhotoSetContent id={id} />
        </Suspense>
    );
}

async function EditPhotoSetContent({ id }: { id: string }) {
    if (!isStudioEnabled() || id === BUILD_PLACEHOLDER_ID) notFound();

    const cookieStore = await cookies();
    if (!isStudioAuthorizedCookie(cookieStore.get(studioCookieName())?.value)) notFound();

    const photoset = await getPhotoSetForEditing(id);
    if (!photoset) notFound();

    return <PhotosetEditor photoset={photoset} />;
}
