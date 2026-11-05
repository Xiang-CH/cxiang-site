// Stand-in for the `server-only` marker package, which throws when imported
// outside a React Server Component. Vitest resolves it to this empty module so
// server-side logic can be exercised in tests.
export {};
