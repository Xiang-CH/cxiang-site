"use client";

import { NotionRenderer } from "react-notion-x";
import dynamic from "next/dynamic";
import Image from "next/image";
import { type ReactNode } from "react";
import { type CodeBlock, type ExtendedRecordMap } from "notion-types";
import SponsorCard from "@/components/sponser-card";
import CopyPageMenu from "./copy-page-menu";
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
    stats?: ReactNode;
    fullPage?: boolean;
}

/**
 * Renders a Notion page with custom navigation, content components, metadata, and sponsorship footer.
 *
 * @param recordMap - The Notion record map containing the page content.
 * @param slug - The page slug used by the copy-page menu.
 * @param publishDate - Optional publication date displayed in the page header.
 * @param stats - Optional statistics rendered alongside the publication date.
 * @param fullPage - Whether to render the page in full-page mode.
 * @returns The rendered Notion page.
 */
export default function NotionPageClient({
    recordMap,
    slug,
    publishDate,
    stats,
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
                <div className="notion-published-date flex flex-wrap items-center gap-x-2.5 gap-y-1 pb-4 text-muted-foreground">
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
                    {stats}
                </div>
            }
            pageFooter={<SponsorCard />}
        />
    );
}
