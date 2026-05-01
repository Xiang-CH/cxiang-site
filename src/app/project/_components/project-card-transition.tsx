"use client";

import { useEffect, useState, ViewTransition } from "react";

export function ProjectCardTransition({
    name,
    children,
}: {
    name: string;
    children: React.ReactNode;
}) {
    const [viewerOpen, setViewerOpen] = useState(false);

    useEffect(() => {
        const updateFromUrl = () => {
            const params = new URL(window.location.href).searchParams;
            setViewerOpen(!!params.get("viewer")?.trim());
        };

        updateFromUrl();
        window.addEventListener("popstate", updateFromUrl);
        window.addEventListener("viewerchange", updateFromUrl);

        return () => {
            window.removeEventListener("popstate", updateFromUrl);
            window.removeEventListener("viewerchange", updateFromUrl);
        };
    }, []);

    if (viewerOpen) {
        return <>{children}</>;
    }

    return (
        <ViewTransition name={name} share="project-open" default="none">
            {children}
        </ViewTransition>
    );
}