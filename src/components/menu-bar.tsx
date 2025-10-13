"use client";
import { useActiveSection } from "@/hooks/useActiveSection";
import { RocketIcon, ReaderIcon } from "@radix-ui/react-icons";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

const menuItems = [
    { href: "/", label: "Home", icon: <RocketIcon /> },
    { href: "/project", label: "Project", icon: <RocketIcon /> },
    { href: "/blog", label: "Blog", icon: <ReaderIcon /> },
];

export default function MenuBar() {
    const currentSection = useActiveSection(".content-section");
    const currentPath = usePathname();

    return (
        <header
            className={cn(
                "w-full top-0 fixed flex items-center justify-between py-4 px-6 box-border z-1 header transition-[top] backdrop-blur-[3px] h-14 bg-background",
                currentSection &&
                    currentSection !== "intro" &&
                    "shadow-[inset_0_-1px_0_0_var(--accent)]"
            )}
        >
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
                        className={cn(
                            "flex items-center gap-1.5 text-card-foreground overflow-x-hidden",
                            (currentPath.startsWith(item.href) && item.href !== "/") ||
                                (item.href === "/" &&
                                    ["/en", "/zh-CN", "/zh-HK"].includes(currentPath))
                                ? "font-normal text-primary"
                                : "text-muted-foreground hover:text-primary transition-colors"
                        )}
                    >
                        {/* {item.icon} */}
                        {item.label}
                    </Link>
                ))}
            </nav>
        </header>
    );
}
