import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { JetBrains_Mono, Open_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "@/app/globals.css";
import MenuBar from "@/components/menu-bar";
import { Person, WebSite, WithContext } from "schema-dts";
import ConsoleArtLogger from "@/components/console-art-logger";
import {
    DEFAULT_OG_IMAGE,
    DEFAULT_SITE_DESCRIPTION,
    SITE_ALTERNATE_NAMES,
    SITE_AUTHOR,
    SITE_NAME,
    SITE_URL,
    absoluteUrl,
    getLocaleAlternateUrls,
} from "@/lib/seo";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Toaster } from "sonner";

const notoSans = Open_Sans({
    variable: "--font-noto-sans",
    subsets: ["latin-ext"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin-ext"],
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_NAME,
        template: "%s | Chen Xiang",
    },
    applicationName: SITE_NAME,
    manifest: "/manifest.json",
    description: DEFAULT_SITE_DESCRIPTION,
    authors: [{ name: SITE_AUTHOR, url: absoluteUrl("/") }],
    creator: SITE_AUTHOR,
    publisher: SITE_AUTHOR,
    alternates: {
        languages: getLocaleAlternateUrls(),
    },
    openGraph: {
        title: SITE_NAME,
        siteName: SITE_NAME,
        url: SITE_URL,
        images: [{ url: DEFAULT_OG_IMAGE }],
        description: DEFAULT_SITE_DESCRIPTION,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: SITE_NAME,
        description: DEFAULT_SITE_DESCRIPTION,
        images: [{ url: DEFAULT_OG_IMAGE }],
    },
};

const websiteJsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    url: SITE_URL,
    description: DEFAULT_SITE_DESCRIPTION,
};

const personJsonLd: WithContext<Person> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_AUTHOR,
    alternateName: SITE_ALTERNATE_NAMES,
    url: SITE_URL,
    image: "https://avatars.githubusercontent.com/u/63144890?s=96&v=4",
    jobTitle: "Full-Stack Software Developer",
    sameAs: [
        "https://github.com/Xiang-CH",
        "https://www.linkedin.com/in/xiang-chen-62389526a/",
        "https://www.instagram.com/chen.xiiang/",
    ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="baidu-site-verification" content="codeva-mxRqrYyNJ1" />
                <meta name="apple-mobile-web-app-title" content="CXiang" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(websiteJsonLd),
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(personJsonLd),
                    }}
                />
            </head>
            <body
                className={`${notoSans.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-full pb-[env(safe-area-inset-bottom)] flex flex-col`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ConsoleArtLogger />
                    <MenuBar />
                    <div className="px-4">
                        <div className="min-h-[calc(100vh-var(--spacing)*28)] max-w-244 mx-auto">
                            {children}
                        </div>
                    </div>
                    <footer className="my-6 flex items-center justify-center px-8 pb-[env(safe-area-inset-bottom)]">
                        <div className="text-[0.65rem] text-muted-foreground w-full flex flex-wrap items-center justify-center gap-3 max-w-244">
                            <span>{"©"} 2026 Chen Xiang</span>
                            <span>|</span>
                            <a
                                href="https://github.com/Xiang-CH/cxiang-site"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                            >
                                <GitHubLogoIcon width={12} />
                                Source Code
                            </a>
                        </div>
                    </footer>
                    <SpeedInsights />
                    <Analytics />
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
