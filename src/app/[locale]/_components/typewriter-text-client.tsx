"use client";

import { useEffect, useMemo, useState } from "react";

type TypewriterTextProps = {
    text: string;
};

export function TypewriterText({ text }: TypewriterTextProps) {
    const typeUnits = useMemo(() => Array.from(text), [text]);
    const [typedLength, setTypedLength] = useState(0);

    useEffect(() => {
        if (typeUnits.length === 0) {
            return;
        }

        const delayMs = 45;
        const timer = window.setInterval(() => {
            setTypedLength((prev) => {
                if (prev >= typeUnits.length) {
                    window.clearInterval(timer);
                    return prev;
                }
                return prev + 1;
            });
        }, delayMs);

        return () => window.clearInterval(timer);
    }, [typeUnits]);

    const typedText = typeUnits.slice(0, typedLength).join("");

    return (
        <span className="th-typewrap">
            <span className="th-typed">{typedText}</span>
            <span className="th-cursor">▌</span>
        </span>
    );
}
