import MainContent from "./_components/main-content";
import Intro from "./_components/intro";
import ScrollArrow from "@/components/scroll-arrow";
import ScrollContainer from "./_components/scroll-container";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chen Xiang (陈想) | Personal Website",
    description: "Personal website and portfolio of Chen Xiang, showcasing projects and experience",
    openGraph: {
        title: "Chen Xiang | Personal Website",
        description: "Portfolio and personal website of Chen Xiang",
        type: "website",
    },
};

export function generateStaticParams() {
    return [{ locale: "en" }, { locale: "zh-CN" }, { locale: "zh-HK" }];
}

export default function Home() {
    return (
        <ScrollContainer>
            <Intro />
            <MainContent />
            <ScrollArrow />
        </ScrollContainer>
    );
}
