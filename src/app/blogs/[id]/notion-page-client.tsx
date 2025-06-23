"use client";

import { useTheme } from "next-themes"
import { NotionRenderer } from 'react-notion-x';
import dynamic from 'next/dynamic';
import { useEffect } from "react";
import { type ExtendedRecordMap } from 'notion-types';


// Dynamically import components used by NotionRenderer, ensuring they are client-side
const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then((m) => m.Code)
);
const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then((m) => m.Collection)
);
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
);
const Modal = dynamic(() =>
  import('react-notion-x/build/third-party/modal').then((m) => m.Modal)
);
const Pdf = dynamic(() =>
  import('react-notion-x/build/third-party/pdf').then((m) => m.Pdf)
);

interface NotionPageClientProps {
  recordMap: ExtendedRecordMap;
  fullPage?: boolean;
  darkMode?: boolean;
}

export default function NotionPageClient({ 
    recordMap,
    fullPage = true, // Default to true as it's common for blog posts
}: NotionPageClientProps) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const lightThemeLink = document.getElementById('light-theme-link');
    const darkThemeLink = document.getElementById('dark-theme-link');

    if (resolvedTheme == "dark"){
      if (lightThemeLink) {
        lightThemeLink.remove();
      }

      if (!darkThemeLink) {
        const link = document.createElement('link');
        link.id = 'dark-theme-link';
        link.rel = 'stylesheet';
        link.href = '/styles/prism-tomorrow.min.css';
        document.head.appendChild(link);
      }
    } else {
      if (darkThemeLink) {
        darkThemeLink.remove();
      }

      if (!lightThemeLink) {
        const link = document.createElement('link');
        link.id = 'light-theme-link';
        link.rel = 'stylesheet';
        link.href = '/styles/prism.min.css';
        document.head.appendChild(link);
      }
    }

  }, [resolvedTheme]);



  return (
    <NotionRenderer
      disableHeader
      recordMap={recordMap}
      fullPage={fullPage}
      darkMode={resolvedTheme === 'dark'}
      showTableOfContents
      components={{
        Code,
        Collection,
        Equation,
        Modal,
        Pdf,
        // pageLink: (props) => (
        //   <Link href={props.href} passHref legacyBehavior>
        //     <a>{props.children}</a>
        //   </Link>
        // ),
      }}
    />
  );
}