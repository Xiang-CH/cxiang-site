import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runHomeTextScramble } from "./home-text-scramble";

// Minimal text-node fixture: exercise the animation's timers and DOM ownership
// without introducing a browser dependency for this helper.
class FixtureText {
    data = "Hello 世界";
    parentNode = {};
    parentElement = { closest: () => null };
}

let text: FixtureText;

beforeEach(() => {
    vi.useFakeTimers();
    text = new FixtureText();
    vi.stubGlobal("Text", FixtureText);
    vi.stubGlobal("NodeFilter", { SHOW_TEXT: 4 });
    vi.stubGlobal("window", {
        setInterval,
        clearInterval,
        matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal("document", {
        createElement: () => ({}),
        createTreeWalker: () => {
            let visited = false;
            return {
                nextNode: () => {
                    if (visited) return null;
                    visited = true;
                    return text;
                },
            };
        },
    });
});

afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("runHomeTextScramble during locale navigation", () => {
    it("continues beyond the former 240ms hold and restores on completion", () => {
        const controller = runHomeTextScramble(document.createElement("main"));
        vi.advanceTimersByTime(900);
        expect(text.data).not.toBe("Hello 世界");
        expect(vi.getTimerCount()).toBe(1);
        controller.cancel();
        expect(text.data).toBe("Hello 世界");
        expect(vi.getTimerCount()).toBe(0);
    });

    it("does not restore old text over a committed translation", () => {
        const controller = runHomeTextScramble(document.createElement("main"));
        vi.advanceTimersByTime(90);
        text.data = "你好，世界";
        controller.cancel();
        expect(text.data).toBe("你好，世界");
        expect(vi.getTimerCount()).toBe(0);
    });

    it("leaves externally updated nodes alone on subsequent frames", () => {
        const controller = runHomeTextScramble(document.createElement("main"));
        vi.advanceTimersByTime(90);
        text.data = "New content";
        vi.advanceTimersByTime(450);
        expect(text.data).toBe("New content");
        controller.cancel();
        expect(text.data).toBe("New content");
    });

    it("respects reduced motion", () => {
        window.matchMedia = vi.fn().mockReturnValue({ matches: true });
        const controller = runHomeTextScramble(document.createElement("main"));
        vi.advanceTimersByTime(900);
        expect(text.data).toBe("Hello 世界");
        expect(vi.getTimerCount()).toBe(0);
        controller.cancel();
    });
});
