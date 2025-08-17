"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface ScrollContainerProps {
    children: React.ReactNode;
}

/**
 * Non-delta classifier with anti-flap hysteresis.
 * Evidence sources:
 * - touchstart => immediate "touch" with cooldown lock.
 * - keydown on paging/arrow keys => immediate "mouse" with lock.
 * - wheel cadence (timestamps only) => pushes a score (+1 continuous, -1 burst).
 *
 * Anti-flap:
 * - Score accumulator with thresholds (+3 => touch, -3 => mouse).
 * - Minimum cooldown between mode changes (SWITCH_COOLDOWN_MS).
 * - Temporary key lock window prefers "mouse" after keyboard steps (KEY_LOCK_MS).
 * - Score decays over idle time to forget stale evidence.
 */
export default function ScrollContainer({ children }: ScrollContainerProps) {
    const [inputMethod, setInputMethod] = useState<"mouse" | "touch" | "unknown">("unknown");

    // Wheel timestamp buffer (ms)
    const wheelTimesRef = useRef<number[]>([]);
    const wheelTimerRef = useRef<number | null>(null);

    // Evidence accumulator and timing guards
    const scoreRef = useRef<number>(0); // negative => mouse-like, positive => touch-like
    const lastChangeRef = useRef<number>(0);
    const lastKeyRef = useRef<number>(-Infinity);
    const lastWheelRef = useRef<number>(-Infinity);

    const classifyFromWheelCadence = useMemo(() => {
        // Cadence window and heuristics (ms)
        const WINDOW_MS = 450;
        const CONTINUOUS_MEDIAN = 24;
        const GAP_FOR_BURST = 100;
        const MIN_EVENTS_CONTINUOUS = 8;

        // Anti-flap tunables
        const SWITCH_COOLDOWN_MS = 1200; // minimum dwell time between mode changes
        const KEY_LOCK_MS = 800; // prefer mouse shortly after keyboard input
        const SCORE_TOUCH_THRESHOLD = 3;
        const SCORE_MOUSE_THRESHOLD = -3;
        const SCORE_DECAY_PER_250MS = 1; // decay magnitude per 250ms without wheel
        const DECAY_STEP_MS = 250;

        function median(arr: number[]): number {
            if (arr.length === 0) return Infinity;
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        }

        function decayScore(now: number) {
            const lastWheel = lastWheelRef.current;
            if (!isFinite(lastWheel)) return;
            const elapsed = now - lastWheel;
            if (elapsed <= 0) return;
            const steps = Math.floor(elapsed / DECAY_STEP_MS);
            if (steps <= 0) return;
            // move score toward 0
            const magnitude = Math.min(Math.abs(scoreRef.current), steps * SCORE_DECAY_PER_250MS);
            if (magnitude > 0) {
                scoreRef.current += scoreRef.current > 0 ? -magnitude : magnitude;
            }
        }

        return (now: number) => {
            const times = wheelTimesRef.current;

            // Drop timestamps outside window
            const cutoff = now - WINDOW_MS;
            while (times.length && times[0] < cutoff) times.shift();

            // Decay score during idle gaps
            decayScore(now);
            lastWheelRef.current = now;

            if (times.length < 2) {
                return;
            }

            // Inter-arrival intervals
            const intervals: number[] = [];
            for (let i = 1; i < times.length; i++) {
                intervals.push(times[i] - times[i - 1]);
            }

            const med = median(intervals);
            const maxGap = Math.max(...intervals);
            const count = times.length;

            const looksContinuous = count >= MIN_EVENTS_CONTINUOUS && med <= CONTINUOUS_MEDIAN && maxGap < GAP_FOR_BURST;
            const looksBurst = maxGap >= GAP_FOR_BURST || count < MIN_EVENTS_CONTINUOUS;

            // Keyboard lock prefers mouse for a brief period
            const nowTs = now;
            const keyLocked = nowTs - lastKeyRef.current <= KEY_LOCK_MS;

            // Update evidence score
            if (looksContinuous && !looksBurst && !keyLocked) {
                scoreRef.current = Math.min(scoreRef.current + 1, SCORE_TOUCH_THRESHOLD);
            } else if (looksBurst) {
                scoreRef.current = Math.max(scoreRef.current - 1, SCORE_MOUSE_THRESHOLD);
            }

            const canSwitch = nowTs - lastChangeRef.current >= SWITCH_COOLDOWN_MS;

            // Decide on switching with hysteresis thresholds
            if (canSwitch) {
                if (scoreRef.current >= SCORE_TOUCH_THRESHOLD && inputMethod !== "touch") {
                    // eslint-disable-next-line no-console
                    console.debug("[input] wheel cadence => continuous (hysteresis: +score)", { count, med, maxGap, intervals, score: scoreRef.current });
                    setInputMethod("touch");
                    lastChangeRef.current = nowTs;
                    // leave small residual to avoid immediate flip
                    scoreRef.current = 1;
                } else if (scoreRef.current <= SCORE_MOUSE_THRESHOLD && inputMethod !== "mouse") {
                    // eslint-disable-next-line no-console
                    console.debug("[input] wheel cadence => burst (hysteresis: -score)", { count, med, maxGap, intervals, score: scoreRef.current });
                    setInputMethod("mouse");
                    lastChangeRef.current = nowTs;
                    scoreRef.current = -1;
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputMethod]);

    useEffect(() => {
        const onTouchStart = () => {
            // Immediate switch to touch, override cooldown
            // eslint-disable-next-line no-console
            console.debug("[input] touchstart => touch (lock)");
            setInputMethod("touch");
            lastChangeRef.current = performance.now();
            // bias score toward touch
            scoreRef.current = Math.max(scoreRef.current, 1);
        };

        const onWheel = () => {
            const now = performance.now();
            wheelTimesRef.current.push(now);

            if (wheelTimerRef.current !== null) {
                window.clearTimeout(wheelTimerRef.current);
            }
            // Group the current burst and then classify
            wheelTimerRef.current = window.setTimeout(() => {
                classifyFromWheelCadence(performance.now());
                wheelTimerRef.current = null;
            }, 0);
        };

        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("wheel", onWheel, { passive: true });

        return () => {
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("wheel", onWheel);
            if (wheelTimerRef.current !== null) {
                window.clearTimeout(wheelTimerRef.current);
                wheelTimerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classifyFromWheelCadence]);

    // Log state transitions
    // useEffect(() => {
    //     // eslint-disable-next-line no-console
    //     console.info("[input] method:", inputMethod);
    // }, [inputMethod]);

    // Map to snap behavior:
    // - "mouse" (burst/step, keyboard paging) => snap-proximity (less sticky)
    // - "touch" (continuous/trackpad, touch)  => snap-mandatory (more guided)
    const snapClass = inputMethod === "mouse" ? "snap-proximity " : "snap-mandatory";

    return (
        <main className={`w-full snap-y overflow-y-auto relative h-[calc(100vh-3.5rem)] box-border main-content ${snapClass}`}>
            {children}
        </main>
    );
}