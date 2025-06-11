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
    <div
      className="flex items-start gap-4 p-6 md:p-20 transition-all bg-neutral-100 dark:bg-neutral-900"
      id="about"
    >
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
    <div className="snap-start h-screen flex flex-col justify-center content-section" id={id}>
      <div className="mt-4 transition-all fade-in">{children}</div>
    </div>
  );
}
