"use client";

import { useState, useEffect, useRef } from "react";
import TocWheel from "@/components/toc-wheel"

const menuItems = [
    { href: "about", label: "About" },
    { href: "experience", label: "Experience" },
    { href: "projects", label: "Projects" },
    { href: "contact", label: "Contact" }
];

export default function MainContent() {
    const [currentSection, setCurrentSection] = useState("About");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            const sections = Array.from(scrollContainer.querySelectorAll('.snap-center'));
            
            // Find the section closest to the center of the viewport
            const viewportCenter = scrollContainer.scrollTop + scrollContainer.clientHeight / 2;
            
            let closestSection = sections[0];
            let closestDistance = Math.abs(closestSection.getBoundingClientRect().top + 
                                          scrollContainer.scrollTop - viewportCenter);
            
            sections.forEach(section => {
                const distance = Math.abs(section.getBoundingClientRect().top + 
                                         scrollContainer.scrollTop - viewportCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSection = section;
                }
            });
            
            // Get the heading text from the closest section
            const heading = closestSection.querySelector('h1');
            if (heading && heading.textContent) {
                setCurrentSection(heading.textContent.trim());
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex items-center gap-4 h-screen p-6 md:p-20 transition-all bg-neutral-100 dark:bg-neutral-900 snap-start" id="about">
            <TocWheel currentSection={currentSection} Sections={menuItems.map((item) => item.label)}/>
            <div ref={scrollContainerRef} className="w-[50%] h-screen overflow-y-scroll snap-mandatory snap-y scrollbar-hide">
                <ContentSection>
                    <h1 className="text-3xl font-bold transition-all fade-in">
                        About
                    </h1>
                </ContentSection>
                <ContentSection>
                    <h1 className="text-3xl font-bold transition-all fade-in">
                        Experience
                    </h1>
                </ContentSection>
                <ContentSection>
                    <h1 className="text-3xl font-bold transition-all fade-in">
                        Projects
                    </h1>
                </ContentSection>
                <ContentSection>
                    <h1 className="text-3xl font-bold transition-all fade-in">
                        Contact
                    </h1>
                </ContentSection>
            </div>
        </div>
    )
}

function ContentSection({children}: {children: React.ReactNode}) {
    return (
        <div className="snap-center h-screen flex flex-col justify-center">
            <div className="mt-4 transition-all fade-in">
                {children}
            </div>
        </div>
    )
}
