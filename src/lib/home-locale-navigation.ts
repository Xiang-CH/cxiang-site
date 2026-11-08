import { runHomeTextScramble, type HomeScrambleController } from "./home-text-scramble";

/** Use document navigation so a locale switch cannot reuse another locale's router cache. */
export function startHomeLocaleNavigation(scope: Element, locale: string): HomeScrambleController {
    const animation = runHomeTextScramble(scope);
    const timer = window.setTimeout(() => {
        // Keep animating while the browser waits for the new document. Restoring
        // here would bring back the pause between animation and page replacement.
        window.location.replace(`/${locale}`);
    }, 500);

    const cancel = () => {
        window.clearTimeout(timer);
        animation.cancel();
        window.removeEventListener("pagehide", cancel);
    };
    // Restore before Safari saves this document in its back/forward cache.
    window.addEventListener("pagehide", cancel, { once: true });
    return { cancel };
}
