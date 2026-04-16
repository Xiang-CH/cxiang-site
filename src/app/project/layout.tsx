import { Suspense } from "react";
import Viewer from "@/components/viewer";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={<></>}>
                <Viewer />
            </Suspense>
            {children}
        </>
    );
}
