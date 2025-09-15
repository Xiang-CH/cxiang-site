"use client";

interface ScrollContainerProps {
    children: React.ReactNode;
}

export default function ScrollContainer({ children }: ScrollContainerProps) {
    return (
        <main className={`w-full overflow-y-auto relative h-[calc(100vh-3.5rem)] box-border main-content snap-y`}>
            {children}
        </main>
    );
}