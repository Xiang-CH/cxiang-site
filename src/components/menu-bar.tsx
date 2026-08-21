"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { scrambleThen } from "@/lib/home-text-scramble";
import { locales, routing } from "@/i18n/routing";
import { getLocalePath } from "@/lib/seo";

const menuItems = [
    { href: "/", label: "Home" },
    { href: "/project", label: "Project" },
    { href: "/blog", label: "Blog" },
] as const;
const homePaths = ["/", "/en", "/zh-CN"];
const LAST_LOCALE_STORAGE_KEY = "last-locale";

type AppLocale = keyof typeof locales;

function isAppLocale(value: string): value is AppLocale {
    return value in locales;
}

function localeFromPathname(pathname: string): AppLocale | null {
    if (pathname === "/") {
        return routing.defaultLocale as AppLocale;
    }
    const segment = pathname.split("/")[1];
    return isAppLocale(segment) ? segment : null;
}

function readStoredLocale(): AppLocale | null {
    try {
        const stored = window.localStorage.getItem(LAST_LOCALE_STORAGE_KEY);
        return isAppLocale(stored ?? "") ? (stored as AppLocale) : null;
    } catch {
        return null;
    }
}

function persistLocale(locale: AppLocale): void {
    try {
        window.localStorage.setItem(LAST_LOCALE_STORAGE_KEY, locale);
    } catch {
        return;
    }
}

const emptySubscribe = () => () => {};

/**
 * Renders the site's navigation bar and coordinates route transitions.
 *
 * The navigation bar is omitted on CLI routes and adapts its layout and active
 * link styling to the current route.
 */
export default function MenuBar() {
    const currentPath = usePathname();
    const router = useRouter();
    const pathnameLocale = localeFromPathname(currentPath);
    const storedLocale = useSyncExternalStore(emptySubscribe, readStoredLocale, () => null);

    useEffect(() => {
        if (pathnameLocale) {
            persistLocale(pathnameLocale);
        }
    }, [pathnameLocale]);

    const homeHref = getLocalePath(pathnameLocale ?? storedLocale ?? routing.defaultLocale);
    const isHomeRoute = homePaths.includes(currentPath);
    const isCliRoute = currentPath === "/cli" || currentPath.endsWith("/cli");

    if (isCliRoute) return null;

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
                            href={homeHref}
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
                                href={item.href === "/" ? homeHref : item.href}
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
