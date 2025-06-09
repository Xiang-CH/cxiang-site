"use client";
import { useEffect, useRef } from "react";

export default function Title({t}: {t: string}) {
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        setTimeout(() => {
            if (titleRef.current) {
                titleRef.current.classList.remove('neon-text');
            }
        }, 1500);
    }, []);

    return (
        <h1 className="text-2xl font-bold transition-all neon-text" ref={titleRef}>{t}</h1>
    );
}