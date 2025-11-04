import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Noto_Sans, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    icons: {
        icon: "/logo.svg",
    },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html suppressHydrationWarning>
            <body
                className={`${notoSans.variable} ${geistMono.variable} antialiased min-h-[100dvh] flex flex-col`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Suspense fallback={<div></div>}>
                        <Viewer />
                    </Suspense>
                    <MenuBar />
                    <div className="h-14" />
                    {children}
                    <Toaster />
                    <SpeedInsights />
                </ThemeProvider>
            </body>
        </html>
    );
}
