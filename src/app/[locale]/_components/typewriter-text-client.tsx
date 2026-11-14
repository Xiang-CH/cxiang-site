"use client";

import { useEffect, useMemo, useState } from "react";

type TypewriterTextProps = {
    text: string;
    noCursor?: boolean;
    phrases?: string[];
};

export function TypewriterText({ text, noCursor = false, phrases = [] }: TypewriterTextProps) {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const currentText = phraseIndex === 0 ? text : (phrases[phraseIndex - 1] ?? text);
    const typeUnits = useMemo(() => Array.from(currentText), [currentText]);
    const [typedLength, setTypedLength] = useState(0);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const complete = typedLength >= typeUnits.length;
        if (complete && !deleting && phrases.length === 0) return;

        const delay = deleting ? 25 : complete ? 2200 : typedLength === 0 ? 300 : 45;
        const timer = window.setTimeout(() => {
            if (deleting) {
                if (typedLength === 0) {
                    setPhraseIndex((index) => (index + 1) % (phrases.length + 1));
                    setDeleting(false);
                } else {
                    setTypedLength((length) => length - 1);
                }
            } else if (complete) {
                setDeleting(true);
            } else {
                setTypedLength((length) => length + 1);
            }
        }, delay);

        return () => window.clearTimeout(timer);
    }, [typeUnits, typedLength, deleting, phrases.length]);

    const typedText = typeUnits.slice(0, typedLength).join("");

    return (
        <span className="th-typewrap" aria-label={currentText}>
            <span className="hidden motion-reduce:inline" aria-hidden="true">
                {currentText}
            </span>
            <span aria-hidden="true" className="th-typed motion-reduce:hidden">
                {typedText}
            </span>
            {!noCursor && (
                <span aria-hidden="true" className="th-cursor motion-reduce:hidden">
                    ▌
                </span>
            )}
        </span>
    );
}
