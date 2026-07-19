"use client";

import { usePathname } from "next/navigation";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { MarkdownIcon } from "@/components/icons/markdown";
import { markdownMirrorPathname } from "@/lib/seo";

export default function SiteFooter() {
    const pathname = usePathname() ?? "/";
    if (pathname === "/cli" || pathname.endsWith("/cli")) return null;

    const markdownHref = markdownMirrorPathname(pathname);

    return (
        <footer className="my-6 flex items-center justify-center px-8 pb-[env(safe-area-inset-bottom)]">
            <div className="text-[0.65rem] text-muted-foreground w-full flex flex-wrap items-center justify-center gap-3 max-w-244">
                <span>{"©"} 2026 Chen Xiang</span>
                <span>|</span>
                <a
                    href={markdownHref}
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                    <MarkdownIcon size={12} className="shrink-0" aria-hidden />
                    View Markdown
                </a>
                <span>|</span>
                <a
                    href="https://github.com/Xiang-CH/cxiang-site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                >
                    <GitHubLogoIcon width={12} />
                    Source Code
                </a>
            </div>
        </footer>
    );
}
