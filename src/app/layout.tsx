import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Noto_Sans, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "@/app/globals.css";
import MenuBar from "@/components/menu-bar";
import { Toaster } from "@/components/ui/sonner";
import Viewer from "@/components/viewer";

const notoSans = Noto_Sans({
    variable: "--font-noto-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Chen Xiang 陈想",
    description: "Chen Xiang's personal website",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="apple-mobile-web-app-title" content="CXiang" />
            </head>
            <body
                className={`${notoSans.variable} ${geistMono.variable} antialiased min-h-full pb-[env(safe-area-inset-bottom)] flex flex-col`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Suspense fallback={<></>}>
                        <Viewer />
                    </Suspense>
                    <MenuBar />
                    {/* <div className="h-14" /> */}
                    <div className="min-h-[calc(100vh-var(--spacing)*27)]">{children}</div>
                    <footer className="my-6 flex items-center justify-center flex-wrap gap-3 px-8 pb-[env(safe-area-inset-bottom)]">
                        <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-3">
                            <p className="text-[0.65rem] text-muted-foreground flex items-center">
                                <span
                                    aria-hidden="true"
                                    className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2"
                                />
                                CXIANG-OS - session active
                            </p>
                            <p className="text-[0.65rem] text-muted-foreground">
                                {"©"} 2026 · Chen Xiang
                            </p>
                        </div>
                    </footer>
                    <Toaster />
                    <SpeedInsights />
                    <Analytics />
                </ThemeProvider>
            </body>
        </html>
    );
}
