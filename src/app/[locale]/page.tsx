import MainContent from "./_components/main-content";
import Intro from "./_components/intro";
import ScrollArrow from "@/components/scroll-arrow";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chen Xiang | Home",
  description: "Personal website and portfolio of Chen Xiang, showcasing projects and experience",
  openGraph: {
    title: "Chen Xiang | Personal Website",
    description: "Portfolio and personal website of Chen Xiang",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-sans)]">
      <main className="w-full snap-mandatory snap-y overflow-y-auto relative h-screen box-border main-content">
        <Intro />
        <MainContent />
        <ScrollArrow />
      </main>
    </div>
  );
}
