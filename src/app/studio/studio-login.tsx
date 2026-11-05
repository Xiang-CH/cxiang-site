"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Gate for the Studio: exchanges the password for an httpOnly session cookie. */
export default function StudioLogin({ passwordRequired = true }: { passwordRequired?: boolean }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setError(null);

        try {
            const response = await fetch("/api/studio/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const body = (await response.json().catch(() => ({}))) as { error?: string };

            if (!response.ok) {
                setError(body.error ?? "Could not sign in");
                return;
            }

            // The cookie is httpOnly, so send the browser back through the
            // server render to pick it up.
            window.location.href = "/studio";
        } catch {
            setError("Could not reach the server");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <form
                onSubmit={onSubmit}
                className="flex w-full max-w-sm flex-col gap-3 rounded-xl border p-6"
            >
                <div className="flex flex-col gap-1">
                    <h1 className="text-lg font-[450]">Studio</h1>
                    <p className="text-sm text-muted-foreground">
                        {passwordRequired
                            ? "Enter the password to manage photo collections."
                            : "Local development has no password set. Set STUDIO_PASSWORD to enable this form (required before deploying)."}
                    </p>
                </div>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" disabled={pending || password.length === 0}>
                    {pending ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </div>
    );
}
