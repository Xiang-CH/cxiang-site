import { useState, useEffect } from "react";

export function useActiveSection(selectorClass: string) {
  const [currentSection, setCurrentSection] = useState("");

  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const sections = Array.from(scrollContainer.querySelectorAll(selectorClass));

      if (sections.length === 0) return;

      // Find the section closest to the center of the viewport
      const viewportCenter = scrollContainer.scrollTop + scrollContainer.clientHeight / 4;

      let closestSection = sections[0];
      let closestDistance = Math.abs(
        closestSection.getBoundingClientRect().top + scrollContainer.scrollTop - viewportCenter
      );

      sections.forEach((section) => {
        const distance = Math.abs(
          section.getBoundingClientRect().top + scrollContainer.scrollTop - viewportCenter
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      });

      // Get the id from the closest section
      if (closestSection && closestSection.id) {
        setCurrentSection(closestSection.id);
      }
    };

    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [selectorClass]);

  return currentSection;
}
