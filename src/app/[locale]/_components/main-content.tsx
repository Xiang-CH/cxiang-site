"use client";

import { useActiveSection } from "@/hooks/useActiveSection";
import TocWheel from "@/components/toc-wheel";

const menuItems = [
    { href: "about", label: "About" },
    { href: "experience", label: "Experience" },
    { href: "projects", label: "Projects" },
    { href: "contact", label: "Contact" },
];

export default function MainContent() {
    const currentSection = useActiveSection(".content-section");

    return (
        <div className="flex items-start gap-4 px-6 md:px-20 pb-20 pt-4 transition-all bg-background">
            <TocWheel
                currentSection={currentSection}
                Sections={menuItems}
                onSectionClick={(section) => {
                    const index = menuItems.findIndex((item) => item.href === section);
                    if (index !== -1 && document) {
                        const targetSection = document.querySelectorAll(".snap-center")[index];
                        targetSection.scrollIntoView({ behavior: "smooth" });
                    }
                }}
            />
            <div className="w-[50%]">
                <ContentSection id="about">
                    <h1 className="text-3xl font-bold transition-all fade-in">About</h1>
                </ContentSection>
                <ContentSection id="experience">
                    <h1 className="text-3xl font-bold transition-all fade-in">Experience</h1>
                </ContentSection>
                <ContentSection id="projects">
                    <h1 className="text-3xl font-bold transition-all fade-in">Projects</h1>
                </ContentSection>
                <ContentSection id="contact">
                    <h1 className="text-3xl font-bold transition-all fade-in">Contact</h1>
                </ContentSection>
            </div>
        </div>
    );
}

function ContentSection({ children, id }: { children: React.ReactNode; id: string }) {
    return (
        <div
            className="snap-start h-[calc(100vh-3.5rem)] flex flex-col justify-center content-section pb-16"
            id={id}
        >
            <div className="mt-4 transition-all fade-in">{children}</div>
        </div>
    );
}
