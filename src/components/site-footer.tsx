"use client";

import { usePathname } from "next/navigation";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { absoluteUrl, markdownMirrorPathname } from "@/lib/seo";

export default function SiteFooter() {
    const pathname = usePathname() ?? "/";
    const markdownHref = absoluteUrl(markdownMirrorPathname(pathname));

    return (
        <footer className="my-6 flex items-center justify-center px-8 pb-[env(safe-area-inset-bottom)]">
            <div className="text-[0.65rem] text-muted-foreground w-full max-w-244 flex flex-col items-center gap-2 text-center sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-0">
                <span>{"©"} 2026 Chen Xiang</span>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    <a
                        href={markdownHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-2 hover:text-primary hover:underline transition-colors"
                    >
                        View as markdown
                    </a>
                    <span className="hidden sm:inline" aria-hidden>
                        |
                    </span>
                    <a
                        href="https://github.com/Xiang-CH/cxiang-site"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline-offset-2 hover:text-primary hover:underline transition-colors"
                    >
                        <GitHubLogoIcon width={12} />
                        Source Code
                    </a>
                </div>
            </div>
        </footer>
    );
}
