"use client";
import { useActiveSection } from "@/hooks/useActiveSection";
import { RocketIcon, ReaderIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const menuItems = [
  { href: "projects", label: "Projects", icon: <RocketIcon /> },
  { href: "blogs", label: "Blogs", icon: <ReaderIcon /> },
];

export default function MenuBar() {
  const currentSection = useActiveSection(".content-section");

  return (
    <header className="w-[calc(100vw-0.9rem)] top-0 fixed flex items-center justify-between py-4 px-6 box-border z-100 header">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className={`text-xl font-bold ${!currentSection || currentSection === "intro" ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
          id="header-name"
        >
          Chen Xiang
        </Link>
      </div>
      <nav className="flex items-center gap-5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 text-card-foreground overflow-x-hidden"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
