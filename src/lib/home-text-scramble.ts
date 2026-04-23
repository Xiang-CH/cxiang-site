const GLYPHS = "█▓░<>{}[]#@$%&*+=~^?/|\\:;`";

function randomGlyph(): string {
    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "?";
}

function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrambleString(original: string): string {
    let out = "";
    for (let i = 0; i < original.length; i++) {
        const ch = original[i]!;
        if (/[A-Za-z0-9]/.test(ch)) {
            out += randomGlyph();
        } else {
            out += ch;
        }
    }
    return out;
}

export type HomeScrambleController = {
    /** Stops the interval; restores text unless `restore` is false (e.g. right before leaving the page). */
    cancel: (opts?: { restore?: boolean }) => void;
};

function collectScrambleTextNodes(scope: Element): Text[] {
    const originals: Text[] = [];
    const walk = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    let n = walk.nextNode();
    while (n) {
        if (n instanceof Text) {
            if (!n.data.trim()) {
                n = walk.nextNode();
                continue;
            }
            const parent = n.parentElement;
            if (!parent || parent.closest("a, script, style, noscript")) {
                n = walk.nextNode();
                continue;
            }
            originals.push(n);
        }
        n = walk.nextNode();
    }
    return originals;
}

/**
 * Scrambles visible text under `scope` (e.g. home `<main>`), preserving whitespace and
 * non-alphanumeric characters; skips text inside links.
 */
export function runHomeTextScramble(
    scope: Element,
    options?: { tickMs?: number }
): HomeScrambleController {
    if (prefersReducedMotion()) {
        return { cancel: () => {} };
    }

    const tickMs = options?.tickMs ?? 45;

    const textNodes = collectScrambleTextNodes(scope);
    const originals = new Map<Text, string>();
    for (const tn of textNodes) {
        originals.set(tn, tn.data);
    }

    if (originals.size === 0) {
        return { cancel: () => {} };
    }

    let stopped = false;
    const interval = window.setInterval(() => {
        if (stopped) return;
        for (const [tn, orig] of originals) {
            if (tn.parentNode) tn.data = scrambleString(orig);
        }
    }, tickMs);

    const cancel = (opts?: { restore?: boolean }) => {
        if (stopped) return;
        stopped = true;
        window.clearInterval(interval);
        const restore = opts?.restore !== false;
        if (!restore) return;
        for (const [tn, orig] of originals) {
            if (tn.parentNode) tn.data = orig;
        }
    };

    return { cancel };
}

export function scrambleThen(
    scope: Element,
    fn: () => void,
    options?: { tickMs?: number; holdMs?: number }
): HomeScrambleController {
    const ctrl = runHomeTextScramble(scope, { tickMs: options?.tickMs });
    const holdMs = options?.holdMs ?? 380;
    const id = window.setTimeout(() => {
        // Always restore originals before navigation. Leaving the DOM scrambled
        // gets frozen in the back-forward cache, so "back to home" shows glitched text.
        ctrl.cancel({ restore: true });
        fn();
    }, holdMs);
    return {
        cancel: (opts) => {
            window.clearTimeout(id);
            ctrl.cancel(opts);
        },
    };
}
