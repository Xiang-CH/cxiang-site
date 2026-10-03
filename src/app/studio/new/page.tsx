import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isStudioAuthorizedCookie, isStudioEnabled, studioCookieName } from "@/lib/studio-auth";
import { type StudioPhotoSet } from "@/lib/photoset-payload";
import PhotosetEditor from "../_components/photoset-editor";

/** Editor for a photoset that does not exist yet. */
export default function NewPhotoSetPage() {
    return (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading editor…</p>}>
            <NewPhotoSetContent />
        </Suspense>
    );
}

async function NewPhotoSetContent() {
    if (!isStudioEnabled()) notFound();

    const cookieStore = await cookies();
    if (!isStudioAuthorizedCookie(cookieStore.get(studioCookieName())?.value)) notFound();

    const blank: StudioPhotoSet = {
        id: "new",
        slug: "",
        title: "",
        abstract: undefined,
        shotOn: undefined,
        published: false,
        coverPhotoId: undefined,
        updatedAt: new Date().toISOString(),
        photos: [],
    };

    return <PhotosetEditor photoset={blank} />;
}
