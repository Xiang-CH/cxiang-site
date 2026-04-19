"use client";

import { useCallback, useState } from "react";
import { ChevronDown, Copy, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { MarkdownIcon } from "@/components/icons/markdown";
import { OpenaiIcon, ClaudeIcon, KimiIcon } from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { absoluteUrl } from "@/lib/seo";

function markdownAbsoluteUrl(slug: string): string {
    return absoluteUrl(`/blog/${slug}.md`);
}

function aiPromptForMarkdown(slug: string): string {
    return `Read ${markdownAbsoluteUrl(slug)} and help me discuss it.`;
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
            await navigator.clipboard.writeText(markdownAbsoluteUrl(slug));
            toast.success("Copied link to Markdown.");
        } catch {
            toast.error("Could not copy to clipboard.");
        }
    }, [slug]);

    const mdPath = `/blog/${slug}.md`;

    const aiProviders = [
        {
            name: "ChatGPT",
            icon: <OpenaiIcon className="size-4" aria-hidden />,
            href: `https://chatgpt.com/?hints=search&q=${encodeURIComponent(aiPromptForMarkdown(slug))}`,
        },
        {
            name: "Claude",
            icon: <ClaudeIcon className="size-4" aria-hidden />,
            href: `https://claude.ai/new?q=${encodeURIComponent(aiPromptForMarkdown(slug))}`,
        },
        {
            name: "Kimi",
            icon: <KimiIcon className="size-4" aria-hidden />,
            href: `https://www.kimi.com/?prefill_prompt=${encodeURIComponent(aiPromptForMarkdown(slug))}`,
        },
    ];

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
                        <ChevronDown className="size-3 mr-px mt-1" aria-hidden />
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
                    {aiProviders.map((provider) => (
                        <DropdownMenuItem asChild key={provider.name}>
                            <a
                                href={provider.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer"
                            >
                                {provider.icon}
                                <span className="flex-1">Ask {provider.name}</span>
                                <ExternalLink className="ml-auto size-4 opacity-70" aria-hidden />
                            </a>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
