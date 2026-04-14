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
    return <Code 
            block={block}
            themes={{
                light: "material-theme-lighter", // "catppuccin-latte",
                dark: "material-theme-darker",
            }}
            showLangLabel={false}
    />;
}

const Collection = dynamic(() =>
    import("react-notion-x/build/third-party/collection").then((m) => m.Collection)
);
const Equation = dynamic(() =>
    import("react-notion-x/build/third-party/equation").then((m) => m.Equation)
);
const Modal = dynamic(() => import("react-notion-x/build/third-party/modal").then((m) => m.Modal));
const Pdf = dynamic(() => import("react-notion-x/build/third-party/pdf").then((m) => m.Pdf));

interface NotionPageClientProps {
    recordMap: ExtendedRecordMap;
    fullPage?: boolean;
}

export default function NotionPageClient({
    recordMap,
    fullPage = true,
}: NotionPageClientProps) {

    return (
        <NotionRenderer
            disableHeader
            recordMap={recordMap}
            fullPage={fullPage}
            showTableOfContents
            components={{
                Code: CustomCode,
                Collection,
                Equation,
                Modal,
                Pdf,
                nextImage: Image,
            }}
            pageFooter={<SponsorCard />}
        />
    );
}
