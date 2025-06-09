"use client";

import { useState, useEffect } from "react";
import { ArrowDownIcon } from "@radix-ui/react-icons";
import { Link } from '@/i18n/navigation';

export default function ScrollArrow() {
  const [nextSection, setNextSection] = useState("#projects");

  useEffect(() => {
    const handleScroll = () => {
      // Get all section elements with IDs
      const sections = Array.from(document.querySelectorAll('section[id], div[id]'))
        .filter(el => el.id !== '')
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      
      // Find the first section that's below the viewport
      const nextVisible = sections.find(section => 
        section.getBoundingClientRect().top > window.innerHeight * 0.5
      );
      
      if (nextVisible) {
        setNextSection(`#${nextVisible.id}`);
      } else if (sections.length > 0) {
        // If we're at the bottom, scroll back to top
        setNextSection('#intro');
      }
    };

    // Initial calculation
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full absolute bottom-4 flex items-center justify-center">
        <Link href={nextSection} className="rounded-full p-1 border-[1px] border-gray-300 dark:border-gray-600 animate-[bounce-down_1s_ease-in-out_infinite]">
            <ArrowDownIcon className="w-4 h-4" />
        </Link>
    </div>
  );
}