import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function useActiveSection(selectorClass: string) {
  const pathname = usePathname();
  const [currentSection, setCurrentSection] = useState("");

  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const sections = Array.from(scrollContainer.querySelectorAll(selectorClass));

      if (sections.length === 0) {
        setCurrentSection("others");
        return;
      };

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
  }, [selectorClass, pathname]);

  useEffect(() => {
    // console.log('Current path:', pathname);
    let prevScrollpos = window.pageYOffset;
    window.onscroll = function() {
      const currentScrollPos = window.pageYOffset;
      const header = document.getElementsByTagName("header")[0]

      if (currentScrollPos <= 60) {
        // If scrolled to the top (within 50px), always show the header
        header.style.top = "0";
      } else if (prevScrollpos > currentScrollPos) {
        header.style.top = "0";
      } else {
        header.style.top = "-4rem";
      }
      prevScrollpos = currentScrollPos;
    } 
  }, [pathname]);

  return currentSection;
}
