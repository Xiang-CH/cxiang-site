"use client";

import { useCallback, useState } from "react";
import { ChevronDown, Copy, ExternalLink, Link2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { MarkdownIcon } from "@/components/icons/markdown";
import { OpenaiIcon } from "@/components/icons/openai";
import { ClaudeIcon } from "@/components/icons/claude";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { absoluteUrl } from "@/lib/seo";

function markdownApiAbsoluteUrl(slug: string): string {
    return absoluteUrl(`/api/md/blog/${slug}`);
}

function aiPromptForMarkdown(slug: string): string {
    return `Read ${markdownApiAbsoluteUrl(slug)} and help me discuss it.`;
}

export default function CopyPageMenu({ slug }: { slug: string }) {
    const [copying, setCopying] = useState(false);

    const copyPageMarkdown = useCallback(async () => {
        setCopying(true);
        try {
            const res = await fetch(`/blog/${slug}`, {
                headers: { Accept: "text/markdown" },
            });
            if (!res.ok) {
                toast.error("Could not load markdown for this page.");
                return;
            }
            const body = await res.text();
            await navigator.clipboard.writeText(body);
            toast.success("Copied page as Markdown.");
        } catch {
            toast.error("Could not copy to clipboard.");
        } finally {
            setCopying(false);
        }
    }, [slug]);

    const copyMarkdownLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(markdownApiAbsoluteUrl(slug));
            toast.success("Copied link to Markdown.");
        } catch {
            toast.error("Could not copy to clipboard.");
        }
    }, [slug]);

    const mdPath = `/api/md/blog/${slug}`;

    return (
        <div className="blog-copy-page-menu flex max-w-full min-w-0">
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 min-w-0 flex-1 shrink gap-1.5 rounded-r-none border-r-0 px-2.5 text-xs shadow-xs"
                disabled={copying}
                onClick={() => void copyPageMarkdown()}
            >
                <Copy className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">Copy as Markdown</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 rounded-l-none border-l px-2 shadow-xs"
                        aria-label="More copy and share options"
                    >
                        <ChevronDown className="size-4" aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={() => void copyMarkdownLink()}
                    >
                        <Link2 className="size-4" aria-hidden />
                        Copy link to Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={mdPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                        >
                            <span className="flex flex-1 items-center gap-2">
                                <MarkdownIcon className="size-4" aria-hidden />
                                View as Markdown
                            </span>
                            <ExternalLink className="ml-auto size-4 opacity-70" aria-hidden />
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={`https://chatgpt.com/?hints=search&q=${encodeURIComponent(aiPromptForMarkdown(slug))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                        >
                            <OpenaiIcon className="size-4" aria-hidden />
                            <span className="flex-1">Open in ChatGPT</span>
                            <ExternalLink className="ml-auto size-4 opacity-70" aria-hidden />
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={`https://claude.ai/new?q=${encodeURIComponent(aiPromptForMarkdown(slug))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer"
                        >
                            <ClaudeIcon className="size-4" aria-hidden />
                            <span className="flex-1">Open in Claude</span>
                            <ExternalLink className="ml-auto size-4 opacity-70" aria-hidden />
                        </a>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
