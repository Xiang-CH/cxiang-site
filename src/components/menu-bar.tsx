"use client";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

const menuItems = [
    { href: "/", label: "Home" },
    { href: "/project", label: "Project" },
    { href: "/blog", label: "Blog" },
];

export default function MenuBar() {
    const currentPath = usePathname();

    return (
        <header
            className={cn(
                currentPath.startsWith("/blog/") && "fixed",
                "w-full top-0 flex items-center justify-between py-4 px-6 box-border z-1 header transition-[top] backdrop-blur-[3px] h-12 bg-background",
                !["/en", "/zh-CN", "/zh-HK"].includes(currentPath) &&
                    "shadow-[inset_0_-1px_0_0_var(--accent)]"
            )}
        >
            <div className="flex items-center gap-4">
                <Link
                    href="/"
                    className={`text-xl font-bold ${["/en", "/zh-CN", "/zh-HK"].includes(currentPath) ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
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
