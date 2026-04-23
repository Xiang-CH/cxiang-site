"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { scrambleThen } from "@/lib/home-text-scramble";

const menuItems = [
    { href: "/", label: "Home" },
    { href: "/project", label: "Project" },
    { href: "/blog", label: "Blog" },
] as const;
const homePaths = ["/", "/en", "/zh-CN"];

export default function MenuBar() {
    const currentPath = usePathname();
    const router = useRouter();
    const isHomeRoute = homePaths.includes(currentPath);

    return (
        <>
            <header
                style={{ viewTransitionName: "site-header" }}
                className={cn(
                    !isHomeRoute && "fixed",
                    "w-full top-0 px-5 box-border z-1 header transition-[top] backdrop-blur-[3px] bg-background",
                    !isHomeRoute && "shadow-[inset_0_-1px_0_0_var(--accent)]"
                )}
            >
                <div className="flex items-center justify-between py-4 h-12 max-w-244 mx-auto">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            transitionTypes={["to-home"]}
                            className={`text-xl font-bold ${isHomeRoute ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
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
                                transitionTypes={
                                    item.href === "/"
                                        ? ["to-home"]
                                        : isHomeRoute
                                          ? ["from-home"]
                                          : undefined
                                }
                                onNavigate={
                                    isHomeRoute && item.href !== "/"
                                        ? (e) => {
                                              const scope =
                                                  document.querySelector(".home-scramble-scope");
                                              if (!(scope instanceof Element)) return;
                                              e.preventDefault();
                                              scrambleThen(scope, () => {
                                                  router.push(item.href, {
                                                      transitionTypes: ["from-home"],
                                                  });
                                              });
                                          }
                                        : undefined
                                }
                                className={cn(
                                    "flex items-center gap-1.5 text-card-foreground overflow-x-hidden",
                                    (currentPath.startsWith(item.href) && item.href !== "/") ||
                                        (item.href === "/" && isHomeRoute)
                                        ? "font-[450] text-primary"
                                        : "text-muted-foreground hover:text-primary transition-colors"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>
            {!isHomeRoute ? <div className="h-12 shrink-0" aria-hidden /> : null}
        </>
    );
}
