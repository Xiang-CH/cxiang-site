"use client";

import { NotionRenderer } from "react-notion-x";
import dynamic from "next/dynamic";
import Image from "next/image";
import { type CodeBlock, type ExtendedRecordMap } from "notion-types";
import SponsorCard from "@/components/sponser-card";
import CopyPageMenu from "./copy-page-menu";
import { BlogStats } from "./blog-stats";
import "./notion.css";

// Dynamically import components used by NotionRenderer, ensuring they are client-side
const Code = dynamic(() => import("react-notion-x-code-block").then((m) => m.Code));
function CustomCode({ block }: { block: CodeBlock }) {
    return (
        <Code
            block={block}
            themes={{
                light: "material-theme-lighter", // "catppuccin-latte",
                dark: "material-theme-darker",
            }}
            showLangLabel={false}
        />
    );
}

const Collection = dynamic(() =>
    import("react-notion-x/build/third-party/collection").then((m) => m.Collection)
);
const Equation = dynamic(() =>
    import("react-notion-x/build/third-party/equation").then((m) => m.Equation)
);

interface NotionPageClientProps {
    recordMap: ExtendedRecordMap;
    slug: string;
    publishDate?: string;
    fullPage?: boolean;
}

export default function NotionPageClient({
    recordMap,
    slug,
    publishDate,
    fullPage = true,
}: NotionPageClientProps) {
    return (
        <NotionRenderer
            disableHeader
            showTableOfContents
            recordMap={recordMap}
            fullPage={fullPage}
            pageAside={<CopyPageMenu slug={slug} />}
            components={{
                Code: CustomCode,
                Collection,
                Equation,
                nextImage: Image,
            }}
            pageHeader={
                <div className="notion-published-date flex flex-wrap items-center gap-x-1.5 gap-y-1 pb-4 text-muted-foreground">
                    {publishDate && (
                        <span>
                            Published on{" "}
                            {new Date(publishDate).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    )}
                    {publishDate && <span aria-hidden>·</span>}
                    <BlogStats slug={slug} />
                </div>
            }
            pageFooter={<SponsorCard />}
        />
    );
}
