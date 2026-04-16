"use client";

import { NotionRenderer } from "react-notion-x";
import dynamic from "next/dynamic";
import Image from "next/image";
import { type CodeBlock, type ExtendedRecordMap } from "notion-types";
import SponsorCard from "@/components/sponser-card";
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
    publishDate?: string;
    fullPage?: boolean;
}

export default function NotionPageClient({
    recordMap,
    publishDate,
    fullPage = true,
}: NotionPageClientProps) {
    return (
        <NotionRenderer
            disableHeader
            recordMap={recordMap}
            fullPage={fullPage}
            components={{
                Code: CustomCode,
                Collection,
                Equation,
                nextImage: Image,
            }}
            pageHeader={
                publishDate && (
                    <p className="notion-published-date text-muted-foreground pb-4">
                        Published on{" "}
                        {new Date(publishDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                )
            }
            pageFooter={<SponsorCard />}
        />
    );
}
