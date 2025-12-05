import MainContent from "./_components/main-content";
import Intro from "./_components/intro";
import ScrollArrow from "@/components/scroll-arrow";
import ScrollContainer from "./_components/scroll-container";
import { setRequestLocale } from "next-intl/server";

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

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
    const { locale } = await params;

    setRequestLocale(locale);

    return (
        <ScrollContainer>
            <Intro locale={locale} />
            <MainContent />
            <ScrollArrow />
        </ScrollContainer>
    );
}
