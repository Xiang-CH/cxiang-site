"use client";

import { useActiveSection } from "@/hooks/useActiveSection";

export default function TocWheel({ Sections }: { Sections: { href: string; label: string }[] }) {
    const currentSection = useActiveSection(".content-section");

    function onSectionClick(section: string) {
        const index = Sections.findIndex((item) => item.href === section);
        if (index !== -1 && document) {
            const targetSection = document.querySelectorAll(".content-section")[index + 1];
            targetSection.scrollIntoView({ behavior: "smooth" });
        }
    }

    return (
        <aside className="w-[50%] hidden md:flex flex-col justify-center items-start gap-2 md:gap-4 md:pl-[5%] lg:pl-[13%] sticky top-0 h-[calc(100vh-3.5rem)] transition-all">
            {Sections.map((section) => {
                return (
                    <div
                        key={section.href}
                        className="flex items-center cursor-pointer"
                        onClick={() => onSectionClick(section.href)}
                    >
                        {section.href === currentSection ? (
                            <>
                                <div className="w-20 h-2 bg-primary/80 transition-all duration-300 ease-in-out my-1" />
                                <div className="mx-4 font-bold text-3xl text-primary transition-all duration-300 ease-in-out">
                                    {section.label}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-2 bg-neutral-300 dark:bg-neutral-600 transition-all duration-300 ease-in-out" />
                                <div className="mx-4 text-md text-neutral-300 dark:text-neutral-600 transition-all duration-300 ease-in-out">
                                    {section.label}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </aside>
    );
}
