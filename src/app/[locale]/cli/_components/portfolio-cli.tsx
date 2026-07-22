"use client";

import "../../_components/terminal-home-client.css";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { XIcon } from "lucide-react";
import type { CliCatalog } from "@/lib/portfolio-catalog";
import { Button } from "@/components/ui/button";
import { TerminalCliViewTransition } from "./terminal-cli-view-transition";

type Contact = {
    label: string;
    value: string;
    href: string;
};

type Experience = {
    role: string;
    org: string;
    period: string;
    website: string;
    commit: string;
};

type SkillGroup = {
    label: string;
    items: Array<{ name: string; href: string }>;
};

export type CliContent = {
    locale: string;
    homeHref: string;
    name: string;
    role: string;
    about: string;
    stack: string;
    experience: Experience[];
    skills: SkillGroup[];
    contacts: Contact[];
    catalog: CliCatalog;
    copy: {
        title: string;
        prompt: string;
        lastUpdate: string;
        welcome: string;
        commandHint: string;
        commands: string;
        files: string;
        emptyProjects: string;
        emptyBlog: string;
        unavailable: string;
        noMatches: string;
        unknownCommand: string;
        missingArgument: string;
        invalidPath: string;
        invalidIndex: string;
        nothingToGrep: string;
        opened: string;
        openUnavailable: string;
        exit: string;
        returnHome: string;
        historyEmpty: string;
        searchUsage: string;
        grepUsage: string;
        commandUsage: string;
        localeUsage: string;
        localeRestart: string;
        localeCancelled: string;
        fileExists: string;
        notDirectory: string;
        parentMissing: string;
        redirectionUsage: string;
        labels: {
            projects: string;
            blog: string;
            experience: string;
            skills: string;
            contact: string;
            date: string;
            english: string;
            chinese: string;
        };
    };
};

type ListingItem = {
    id: string;
    title: string;
    detail?: string;
    href?: string;
    kind?: "file" | "directory";
};

type OutputEntry =
    | { type: "command"; text: string; path: string }
    | { type: "text" | "error" | "banner"; text: string }
    | { type: "inline-items"; items: ListingItem[] }
    | { type: "items"; title?: string; items: ListingItem[] }
    | { type: "link"; text: string; href: string; label: string };

type CommandResult = {
    entries: OutputEntry[];
    filterable?: ListingItem[];
};

type VirtualNode = { kind: "directory" } | { kind: "file"; content: string };

const COMMANDS = [
    "help",
    "pwd",
    "ls",
    "cd",
    "cat",
    "echo",
    "mkdir",
    "touch",
    "locale",
    "whoami",
    "about",
    "experience",
    "skills",
    "contact",
    "projects",
    "blog",
    "search",
    "open",
    "history",
    "clear",
    "exit",
];

const HOME_DIR = "/user/cxiang";
const BIN_DIR = "/bin";
const PATHS = [
    "/",
    BIN_DIR,
    "/user",
    HOME_DIR,
    "~",
    "~/about.txt",
    "~/experience.log",
    "~/skills",
    "~/contact.json",
    "~/projects",
    "~/blog",
];

const CLI_BANNER = [
    "██╗  ██╗██╗ █████╗ ███╗   ██╗ ██████╗   ██████╗ ███████╗",
    "╚██╗██╔╝██║██╔══██╗████╗  ██║██╔════╝  ██╔═══██╗██╔════╝",
    " ╚███╔╝ ██║███████║██╔██╗ ██║██║  ███╗ ██║   ██║███████╗",
    " ██╔██╗ ██║██╔══██║██║╚██╗██║██║   ██║ ██║   ██║╚════██║",
    "██╔╝ ██╗██║██║  ██║██║ ╚████║╚██████╔╝ ╚██████╔╝███████║",
    "╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝   ╚═════╝ ╚══════╝",
].join("\n");

/**
 * Splits input into trimmed segments while preserving separators inside quoted or escaped text.
 *
 * @param input - The text to split
 * @param separator - The character that separates segments outside quotes
 * @returns The non-empty trimmed segments
 */
function splitOutsideQuotes(input: string, separator: string): string[] {
    const parts: string[] = [];
    let current = "";
    let quote: "'" | '"' | null = null;
    let escaped = false;

    for (const character of input) {
        if (escaped) {
            current += character;
            escaped = false;
            continue;
        }
        if (character === "\\") {
            current += character;
            escaped = true;
            continue;
        }
        if ((character === "'" || character === '"') && (!quote || quote === character)) {
            quote = quote ? null : character;
            current += character;
            continue;
        }
        if (!quote && character === separator) {
            if (current.trim()) parts.push(current.trim());
            current = "";
            continue;
        }
        current += character;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
}

/**
 * Splits a command string into tokens while preserving quoted content and escaped characters.
 *
 * @param input - The command string to tokenize
 * @returns The resulting tokens
 */
function tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let quote: "'" | '"' | null = null;
    let escaped = false;

    for (const character of input.trim()) {
        if (escaped) {
            current += character;
            escaped = false;
            continue;
        }
        if (character === "\\") {
            escaped = true;
            continue;
        }
        if ((character === "'" || character === '"') && (!quote || quote === character)) {
            quote = quote ? null : character;
            continue;
        }
        if (!quote && /\s/.test(character)) {
            if (current) tokens.push(current);
            current = "";
            continue;
        }
        current += character;
    }

    if (current) tokens.push(current);
    return tokens;
}

/**
 * Resolves a path against the current working directory and removes redundant path segments.
 *
 * @param path - The path to normalize, including optional `~`, `.`, and `..` segments
 * @param cwd - The current working directory used for relative paths
 * @returns The normalized absolute path
 */
function normalizePath(path: string, cwd: string): string {
    if (!path || path === ".") return cwd;
    const basePath = path === "~" || path.startsWith("~/") ? `${HOME_DIR}${path.slice(1)}` : path;
    const segments = (basePath.startsWith("/") ? basePath : `${cwd}/${basePath}`).split("/");
    const normalized: string[] = [];

    for (const segment of segments) {
        if (!segment || segment === ".") continue;
        if (segment === "..") {
            normalized.pop();
        } else {
            normalized.push(segment);
        }
    }

    return `/${normalized.join("/")}` || "/";
}

/**
 * Formats a path for display by replacing the home directory prefix with `~`.
 *
 * @param path - The path to format
 * @returns The display-formatted path
 */
function displayPath(path: string): string {
    if (path === HOME_DIR) return "~";
    return path.startsWith(`${HOME_DIR}/`) ? `~${path.slice(HOME_DIR.length)}` : path;
}

/**
 * Gets the parent directory of a slash-separated path.
 *
 * @param path - The path whose parent directory to resolve
 * @returns The parent path, or `/` when the path has no parent
 */
function parentPath(path: string): string {
    const segments = path.split("/").filter(Boolean);
    segments.pop();
    return segments.length ? `/${segments.join("/")}` : "/";
}

/**
 * Extracts the final non-empty segment from a slash-separated path.
 *
 * @param path - The path to inspect
 * @returns The final non-empty path segment, or an empty string when none exists
 */
function basename(path: string): string {
    return path.split("/").filter(Boolean).at(-1) ?? "";
}

/**
 * Separates a command from its optional output redirection target.
 *
 * @param input - The command text to parse
 * @returns The command and, when present, the redirection target and append mode
 */
function splitRedirection(input: string): {
    command: string;
    target?: string;
    append?: boolean;
} {
    let quote: "'" | '"' | null = null;
    let escaped = false;

    for (let index = 0; index < input.length; index += 1) {
        const character = input[index];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (character === "\\") {
            escaped = true;
            continue;
        }
        if ((character === "'" || character === '"') && (!quote || quote === character)) {
            quote = quote ? null : character;
            continue;
        }
        if (!quote && character === ">") {
            const append = input[index + 1] === ">";
            return {
                command: input.slice(0, index).trim(),
                target: input.slice(index + (append ? 2 : 1)).trim(),
                append,
            };
        }
    }

    return { command: input.trim() };
}

/**
 * Determines whether a listing item contains the specified search query.
 *
 * @param item - The listing item to search
 * @param query - The case-insensitive query to match
 * @returns `true` if the item's identifier, title, or detail contains the query, `false` otherwise.
 */
function matchesQuery(item: ListingItem, query: string): boolean {
    return `${item.id} ${item.title} ${item.detail ?? ""}`.toLocaleLowerCase().includes(query);
}

/**
 * Renders an interactive terminal interface for browsing portfolio content and executing CLI commands.
 *
 * @param content - Localized portfolio data and interface text used by the terminal.
 */
export default function PortfolioCli({ content }: { content: CliContent }) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const cwdRef = useRef(HOME_DIR);
    const virtualNodesRef = useRef<Record<string, VirtualNode>>({});
    const [cwd, setCwd] = useState(HOME_DIR);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [pendingLocale, setPendingLocale] = useState<"en" | "zh-CN" | null>(null);
    const [output, setOutput] = useState<OutputEntry[]>(() => [
        { type: "banner", text: CLI_BANNER },
        { type: "text", text: content.copy.lastUpdate },
        { type: "text", text: content.copy.welcome },
        { type: "text", text: content.copy.commandHint },
    ]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useLayoutEffect(() => {
        const transcript = transcriptRef.current;
        if (transcript) transcript.scrollTop = transcript.scrollHeight;
    }, [output]);

    const projectItems = (): ListingItem[] =>
        content.catalog.projects.map((project, index) => ({
            id: `project:${index + 1}`,
            title: project.title,
            detail: [
                project.date && `${content.copy.labels.date}: ${project.date}`,
                project.abstract,
            ]
                .filter(Boolean)
                .join(" — "),
            href: project.landingUrl ?? project.url ?? project.repoUrl,
        }));

    const blogItems = (): ListingItem[] =>
        content.catalog.blogPosts.map((post, index) => ({
            id: `blog:${index + 1}`,
            title: post.title,
            detail: [post.date && `${content.copy.labels.date}: ${post.date}`, post.abstract]
                .filter(Boolean)
                .join(" — "),
            href: `/blog/${post.slug}`,
        }));

    const collectionResult = (kind: "projects" | "blog"): CommandResult => {
        if (content.catalog.availability === "unavailable") {
            return { entries: [{ type: "error", text: content.copy.unavailable }] };
        }

        const items = kind === "projects" ? projectItems() : blogItems();
        if (items.length === 0) {
            return {
                entries: [
                    {
                        type: "text",
                        text:
                            kind === "projects"
                                ? content.copy.emptyProjects
                                : content.copy.emptyBlog,
                    },
                ],
            };
        }

        return {
            entries: [{ type: "items", items }],
            filterable: items,
        };
    };

    const homeListing = (): ListingItem[] => [
        { id: "about.txt", title: "about.txt", kind: "file" },
        { id: "experience.log", title: "experience.log", kind: "file" },
        { id: "skills/", title: "skills/", kind: "directory" },
        { id: "contact.json", title: "contact.json", kind: "file" },
        { id: "projects/", title: "projects/", kind: "directory" },
        { id: "blog/", title: "blog/", kind: "directory" },
    ];

    const binListing = (): ListingItem[] =>
        COMMANDS.map((command) => ({ id: command, title: command, kind: "file" }));

    const rootListing = (): ListingItem[] => [
        { id: "bin/", title: "bin/", kind: "directory" },
        { id: "user/", title: "user/", kind: "directory" },
    ];

    const isBuiltInDirectory = (path: string) =>
        [
            "/",
            BIN_DIR,
            "/user",
            HOME_DIR,
            `${HOME_DIR}/projects`,
            `${HOME_DIR}/blog`,
            `${HOME_DIR}/skills`,
        ].includes(path);

    const isBuiltInFile = (path: string) =>
        [
            `${HOME_DIR}/about.txt`,
            `${HOME_DIR}/experience.log`,
            `${HOME_DIR}/contact.json`,
        ].includes(path);

    const isDirectory = (path: string) =>
        virtualNodesRef.current[path]?.kind === "directory" || isBuiltInDirectory(path);

    const pathExists = (path: string) =>
        Boolean(virtualNodesRef.current[path]) || isBuiltInDirectory(path) || isBuiltInFile(path);

    const directoryItems = (path: string, items: ListingItem[] = []): CommandResult => {
        const dynamicItems: ListingItem[] = Object.entries(virtualNodesRef.current)
            .filter(([nodePath]) => parentPath(nodePath) === path)
            .map(([nodePath, node]) => {
                const name = `${basename(nodePath)}${node.kind === "directory" ? "/" : ""}`;
                return {
                    id: name,
                    title: name,
                    kind: node.kind === "directory" ? "directory" : "file",
                };
            });
        const dynamicNames = new Set(dynamicItems.map((item) => item.title));
        const combined = [
            ...items.filter((item) => !dynamicNames.has(item.title)),
            ...dynamicItems,
        ].sort((left, right) => left.title.localeCompare(right.title));

        return { entries: [{ type: "items" as const, items: combined }], filterable: combined };
    };

    const ensureParentDirectory = (path: string): CommandResult | null => {
        const parent = parentPath(path);
        return isDirectory(parent)
            ? null
            : { entries: [{ type: "error", text: `${content.copy.parentMissing}: ${parent}` }] };
    };

    const openLink = (href: string, label: string): CommandResult => {
        window.open(href, "_blank", "noopener,noreferrer");
        return {
            entries: [{ type: "link", text: `${content.copy.opened}:`, href, label }],
        };
    };

    const localeName = (locale: "en" | "zh-CN") =>
        locale === "en" ? content.copy.labels.english : content.copy.labels.chinese;

    const cliHref = (locale: "en" | "zh-CN") => `/${locale}/cli`;

    const readPath = (path: string): CommandResult => {
        const virtualNode = virtualNodesRef.current[path];
        if (virtualNode?.kind === "file") {
            return { entries: [{ type: "text", text: virtualNode.content }] };
        }
        if (virtualNode?.kind === "directory") return directoryItems(path);
        if (path === "/") {
            return directoryItems(path, rootListing());
        }
        if (path === "/user") {
            return directoryItems(path, [{ id: "cxiang/", title: "cxiang/", kind: "directory" }]);
        }
        if (path === BIN_DIR) {
            return directoryItems(path, binListing());
        }
        if (path === HOME_DIR) {
            return directoryItems(path, homeListing());
        }
        if (path === `${HOME_DIR}/about.txt`) {
            return {
                entries: [
                    { type: "text", text: `${content.name}\n${content.role}` },
                    { type: "text", text: `${content.about}\n\n${content.stack}` },
                ],
            };
        }
        if (path === `${HOME_DIR}/experience.log`) {
            const items = content.experience.map((item) => ({
                id: item.commit,
                title: `${item.role} · ${item.org}`,
                detail: item.period,
                href: item.website,
            }));
            return {
                entries: [{ type: "items", items }],
                filterable: items,
            };
        }
        if (path === `${HOME_DIR}/skills`) {
            const items = content.skills.flatMap((group) =>
                group.items.map((item) => ({
                    id: item.name.toLowerCase(),
                    title: item.name,
                    detail: group.label,
                    href: item.href,
                }))
            );
            return {
                entries: [{ type: "items", items }],
                filterable: items,
            };
        }
        if (path === `${HOME_DIR}/contact.json`) {
            const items = content.contacts.map((contact) => ({
                id: contact.label,
                title: contact.value,
                href: contact.href,
            }));
            return {
                entries: [{ type: "items", items }],
                filterable: items,
            };
        }
        if (path === `${HOME_DIR}/projects`) return collectionResult("projects");
        if (path === `${HOME_DIR}/blog`) return collectionResult("blog");

        return { entries: [{ type: "error", text: `${content.copy.invalidPath}: ${path}` }] };
    };

    const runCommand = (rawCommand: string): CommandResult => {
        const redirection = splitRedirection(rawCommand);
        const tokens = tokenize(redirection.command);
        if (tokens.length === 0) return { entries: [] };

        const [rawName, ...args] = tokens;
        const command = rawName.toLowerCase();
        const missingArgument = () => ({
            entries: [{ type: "error" as const, text: content.copy.missingArgument }],
        });

        if (command === "help") {
            const target = args[0]?.toLowerCase();
            const usage = target
                ? {
                      ls: "ls [-l] [path]",
                      cd: "cd [path]",
                      cat: "cat <path>",
                      echo: "echo TEXT [> FILE | >> FILE]",
                      mkdir: "mkdir [-p] <path>",
                      touch: "touch <path>",
                      locale: "locale <en|zh-CN>",
                      search: "search <query> [--in=all|projects|blog]",
                      open: "open <path|project:N|blog:N> [--repo]",
                  }[target]
                : undefined;
            return {
                entries: [
                    { type: "text", text: usage ?? content.copy.commands },
                    ...(usage ? [] : [{ type: "text" as const, text: content.copy.files }]),
                ],
            };
        }
        if (command === "pwd") {
            return { entries: [{ type: "text", text: cwdRef.current }] };
        }
        if (command === "clear") return { entries: [] };
        if (command === "exit") {
            router.push(content.homeHref, { transitionTypes: ["from-cli"] });
            return { entries: [{ type: "text", text: content.copy.exit }] };
        }
        if (command === "history") {
            if (history.length === 0)
                return { entries: [{ type: "text", text: content.copy.historyEmpty }] };
            return {
                entries: history.map((item, index) => ({
                    type: "text",
                    text: `${index + 1}  ${item}`,
                })),
            };
        }
        if (command === "ls") {
            if (redirection.target !== undefined)
                return { entries: [{ type: "error", text: content.copy.redirectionUsage }] };
            const pathArg = args.find((argument) => !argument.startsWith("-"));
            const path = normalizePath(pathArg ?? cwdRef.current, cwdRef.current);
            if (isDirectory(path)) {
                const result = readPath(path);
                if (args.includes("-l")) return result;
                const listing = result.entries.find(
                    (entry): entry is Extract<OutputEntry, { type: "items" }> =>
                        entry.type === "items"
                );
                return listing
                    ? {
                          entries: [
                              {
                                  type: "inline-items",
                                  items: listing.items,
                              },
                          ],
                          filterable: listing.items,
                      }
                    : result;
            }
            if (pathExists(path)) {
                const name = basename(path);
                const items = [{ id: name, title: name, kind: "file" as const }];
                return args.includes("-l")
                    ? { entries: [{ type: "items", items }], filterable: items }
                    : { entries: [{ type: "inline-items", items }], filterable: items };
            }
            return { entries: [{ type: "error", text: `${content.copy.invalidPath}: ${path}` }] };
        }
        if (command === "cd") {
            if (!args[0]) return missingArgument();
            const path = normalizePath(args[0], cwdRef.current);
            if (!isDirectory(path)) {
                return {
                    entries: [{ type: "error", text: `${content.copy.invalidPath}: ${path}` }],
                };
            }
            cwdRef.current = path;
            setCwd(path);
            return { entries: [] };
        }
        if (command === "cat") {
            if (!args[0]) return missingArgument();
            if (redirection.target !== undefined)
                return { entries: [{ type: "error", text: content.copy.redirectionUsage }] };
            const path = normalizePath(args[0], cwdRef.current);
            if (isDirectory(path))
                return {
                    entries: [{ type: "error", text: `${content.copy.notDirectory}: ${path}` }],
                };
            return readPath(path);
        }
        if (command === "echo") {
            const text = args.join(" ");
            if (redirection.target === undefined) return { entries: [{ type: "text", text }] };
            const [target] = tokenize(redirection.target);
            if (!target || tokenize(redirection.target).length !== 1) {
                return { entries: [{ type: "error", text: content.copy.redirectionUsage }] };
            }
            const path = normalizePath(target, cwdRef.current);
            const parentResult = ensureParentDirectory(path);
            if (parentResult) return parentResult;
            if (isDirectory(path)) {
                return {
                    entries: [{ type: "error", text: `${content.copy.notDirectory}: ${path}` }],
                };
            }
            const existing = virtualNodesRef.current[path];
            virtualNodesRef.current[path] = {
                kind: "file",
                content:
                    redirection.append && existing?.kind === "file"
                        ? `${existing.content}${existing.content ? "\n" : ""}${text}`
                        : text,
            };
            return { entries: [] };
        }
        if (command === "touch") {
            if (!args.length) return missingArgument();
            for (const target of args) {
                const path = normalizePath(target, cwdRef.current);
                const parentResult = ensureParentDirectory(path);
                if (parentResult) return parentResult;
                if (isDirectory(path)) {
                    return {
                        entries: [{ type: "error", text: `${content.copy.notDirectory}: ${path}` }],
                    };
                }
                if (!pathExists(path))
                    virtualNodesRef.current[path] = { kind: "file", content: "" };
            }
            return { entries: [] };
        }
        if (command === "mkdir") {
            const createParents = args.includes("-p");
            const paths = args.filter((argument) => argument !== "-p");
            if (!paths.length) return missingArgument();
            for (const target of paths) {
                const path = normalizePath(target, cwdRef.current);
                if (pathExists(path)) {
                    if (createParents && isDirectory(path)) continue;
                    return {
                        entries: [{ type: "error", text: `${content.copy.fileExists}: ${path}` }],
                    };
                }
                if (createParents) {
                    const segments = path.split("/").filter(Boolean);
                    for (let index = 1; index <= segments.length; index += 1) {
                        const candidate = `/${segments.slice(0, index).join("/")}`;
                        if (!pathExists(candidate)) {
                            virtualNodesRef.current[candidate] = { kind: "directory" };
                        }
                    }
                } else {
                    const parentResult = ensureParentDirectory(path);
                    if (parentResult) return parentResult;
                    virtualNodesRef.current[path] = { kind: "directory" };
                }
            }
            return { entries: [] };
        }
        if (command === "locale") {
            const requested = args[0]?.toLowerCase();
            const target = requested === "en" ? "en" : requested === "zh-cn" ? "zh-CN" : null;
            if (!target || args.length !== 1) {
                return { entries: [{ type: "text", text: content.copy.localeUsage }] };
            }
            if (target === content.locale) {
                return { entries: [{ type: "text", text: content.copy.localeUsage }] };
            }
            setPendingLocale(target);
            return { entries: [] };
        }
        if (command === "whoami") return readPath(`${HOME_DIR}/about.txt`);
        if (command === "about") return readPath(`${HOME_DIR}/about.txt`);
        if (command === "experience") return readPath(`${HOME_DIR}/experience.log`);
        if (command === "skills") return readPath(`${HOME_DIR}/skills`);
        if (command === "contact") return readPath(`${HOME_DIR}/contact.json`);
        if (command === "projects") return collectionResult("projects");
        if (command === "blog") return collectionResult("blog");
        if (command === "search") {
            let scope = "all";
            const terms: string[] = [];
            for (let index = 0; index < args.length; index += 1) {
                const argument = args[index];
                if (argument.startsWith("--in=")) {
                    scope = argument.slice("--in=".length).toLowerCase();
                } else if (argument === "--in" && args[index + 1]) {
                    scope = args[index + 1].toLowerCase();
                    index += 1;
                } else {
                    terms.push(argument);
                }
            }
            if (!terms.length || !["all", "projects", "blog"].includes(scope)) {
                return { entries: [{ type: "error", text: content.copy.searchUsage }] };
            }
            if (content.catalog.availability === "unavailable") {
                return { entries: [{ type: "error", text: content.copy.unavailable }] };
            }
            const query = terms.join(" ").toLocaleLowerCase();
            const items = [
                ...(scope === "all" || scope === "projects" ? projectItems() : []),
                ...(scope === "all" || scope === "blog" ? blogItems() : []),
            ].filter((item) => matchesQuery(item, query));
            if (!items.length) return { entries: [{ type: "text", text: content.copy.noMatches }] };
            return {
                entries: [{ type: "items", items }],
                filterable: items,
            };
        }
        if (command === "open") {
            if (!args[0]) return missingArgument();
            const target = args[0].toLowerCase();
            const targetPath = normalizePath(target, cwdRef.current);
            if (target === "projects" || targetPath === `${HOME_DIR}/projects`) {
                return openLink("/project", content.copy.labels.projects);
            }
            if (target === "blog" || targetPath === `${HOME_DIR}/blog`) {
                return openLink("/blog", content.copy.labels.blog);
            }

            const match = /^(project|blog):(\d+)$/.exec(target.replace(/^\//, ""));
            if (!match) return { entries: [{ type: "error", text: content.copy.openUnavailable }] };

            const index = Number(match[2]) - 1;
            if (match[1] === "project") {
                const project = content.catalog.projects[index];
                if (!project)
                    return { entries: [{ type: "error", text: content.copy.invalidIndex }] };
                const href = args.includes("--repo")
                    ? project.repoUrl
                    : (project.landingUrl ?? project.url ?? project.repoUrl);
                return href
                    ? openLink(href, project.title)
                    : { entries: [{ type: "error", text: content.copy.openUnavailable }] };
            }

            const post = content.catalog.blogPosts[index];
            return post
                ? openLink(`/blog/${post.slug}`, post.title)
                : { entries: [{ type: "error", text: content.copy.invalidIndex }] };
        }

        return { entries: [{ type: "error", text: `${content.copy.unknownCommand}: ${rawName}` }] };
    };

    const submit = (value: string) => {
        const commands = splitOutsideQuotes(value, ";");
        if (!commands.length) return;

        if (pendingLocale) {
            const answer = value.trim().toLocaleLowerCase();
            const confirmed = answer === "y" || answer === "yes";
            const question = content.copy.localeRestart.replace(
                "{language}",
                localeName(pendingLocale)
            );
            const nextOutput: OutputEntry[] = [
                {
                    type: "text",
                    text: `${question} ${value}`,
                },
                ...(confirmed
                    ? []
                    : [{ type: "text" as const, text: content.copy.localeCancelled }]),
            ];
            setOutput((previous) => [...previous, ...nextOutput]);
            setHistory((previous) => [...previous, value]);
            setHistoryIndex(null);
            setInput("");
            setSuggestions([]);
            setPendingLocale(null);
            if (confirmed) window.location.assign(cliHref(pendingLocale));
            return;
        }

        const nextOutput: OutputEntry[] = [];
        let clearedTranscript = false;
        for (const commandText of commands) {
            nextOutput.push({
                type: "command",
                path: displayPath(cwdRef.current),
                text: commandText,
            });
            const pipeline = splitOutsideQuotes(commandText, "|");
            let result = runCommand(pipeline[0]);

            for (const stage of pipeline.slice(1)) {
                const [name, ...args] = tokenize(stage);
                if (name?.toLowerCase() !== "grep" || !args.length) {
                    result = { entries: [{ type: "error", text: content.copy.grepUsage }] };
                    break;
                }
                if (!result.filterable) {
                    result = { entries: [{ type: "error", text: content.copy.nothingToGrep }] };
                    break;
                }
                const query = args.join(" ").toLocaleLowerCase();
                const items = result.filterable.filter((item) => matchesQuery(item, query));
                result = items.length
                    ? {
                          entries: [{ type: "items", title: `grep: ${args.join(" ")}`, items }],
                          filterable: items,
                      }
                    : { entries: [{ type: "text", text: content.copy.noMatches }] };
            }

            if (tokenize(pipeline[0])[0]?.toLowerCase() === "clear" && pipeline.length === 1) {
                nextOutput.length = 0;
                clearedTranscript = true;
            } else {
                nextOutput.push(...result.entries);
            }
        }

        setOutput((previous) => [...(clearedTranscript ? [] : previous), ...nextOutput]);
        setHistory((previous) => [...previous, value]);
        setHistoryIndex(null);
        setInput("");
        setSuggestions([]);
    };

    const complete = () => {
        const tokens = tokenize(input);
        const hasTrailingSpace = /\s$/.test(input);
        const command = tokens[0]?.toLowerCase();
        let candidates: string[] = [];

        if (tokens.length <= 1 && !hasTrailingSpace) {
            candidates = COMMANDS.filter((candidate) =>
                candidate.startsWith(tokens[0]?.toLowerCase() ?? "")
            );
        } else if (["ls", "cd", "cat", "open"].includes(command)) {
            const current = hasTrailingSpace ? "" : (tokens.at(-1) ?? "");
            candidates = [
                ...PATHS,
                ...Object.keys(virtualNodesRef.current).map(displayPath),
                ...projectItems().map((item) => item.id),
                ...blogItems().map((item) => item.id),
            ].filter((candidate) => candidate.startsWith(current));
        } else if (command === "locale") {
            const current = hasTrailingSpace ? "" : (tokens.at(-1) ?? "");
            candidates = ["en", "zh-CN"].filter((candidate) => candidate.startsWith(current));
        } else if (command === "search") {
            const current = hasTrailingSpace ? "" : (tokens.at(-1) ?? "");
            candidates = ["--in=all", "--in=projects", "--in=blog"].filter((candidate) =>
                candidate.startsWith(current)
            );
        }

        if (candidates.length === 1) {
            const completed = candidates[0];
            const prefix =
                tokens.length <= 1 && !hasTrailingSpace
                    ? ""
                    : input.slice(
                          0,
                          input.length - (hasTrailingSpace ? 0 : (tokens.at(-1)?.length ?? 0))
                      );
            setInput(`${prefix}${completed}${tokens.length <= 1 ? " " : ""}`);
            setSuggestions([]);
        } else {
            setSuggestions(candidates);
        }
    };

    return (
        <TerminalCliViewTransition>
            <main className="terminal-page cli-terminal-page h-dvh overflow-hidden bg-(--th-bg) px-1 py-4 font-mono text-(--th-text)">
                <section className="mx-auto flex h-full min-h-0 max-w-5xl flex-col overflow-hidden border border-(--th-border) bg-(--th-bg) p-3 sm:p-5">
                    <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-(--th-border) pb-3">
                        <p className="text-xs tracking-[0.2em] text-(--cli-site-accent)">
                            {content.copy.title}
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-[0.65rem] text-cyan-700 dark:text-cyan-300">
                                cwd: {displayPath(cwd)}
                            </p>
                            <Button
                                asChild
                                size="icon-sm"
                                variant="ghost"
                                className="text-(--th-dim) hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300"
                            >
                                <Link
                                    href={content.homeHref}
                                    transitionTypes={["from-cli"]}
                                    aria-label={content.copy.returnHome}
                                    title={content.copy.returnHome}
                                >
                                    <XIcon aria-hidden="true" />
                                </Link>
                            </Button>
                        </div>
                    </header>

                    <div
                        ref={transcriptRef}
                        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
                    >
                        <div
                            role="log"
                            aria-live="polite"
                            aria-relevant="additions"
                            className="space-y-3 break-words text-sm leading-6"
                        >
                            {output.map((entry, index) => {
                                if (entry.type === "inline-items") {
                                    return (
                                        <p key={`${entry.type}-${index}`}>
                                            {entry.items.map((item, itemIndex) => (
                                                <span
                                                    key={item.id}
                                                    className={
                                                        item.kind === "directory"
                                                            ? "text-cyan-700 dark:text-cyan-300"
                                                            : undefined
                                                    }
                                                >
                                                    {item.title}
                                                    {itemIndex < entry.items.length - 1 ? "  " : ""}
                                                </span>
                                            ))}
                                        </p>
                                    );
                                }
                                if (entry.type === "items") {
                                    return (
                                        <div key={`${entry.type}-${index}`}>
                                            {entry.title && (
                                                <p className="mb-1 text-xs text-emerald-700 dark:text-emerald-300">
                                                    {entry.title}
                                                </p>
                                            )}
                                            <ul className="space-y-2 border-l border-cyan-600/35 pl-3 dark:border-cyan-300/35">
                                                {entry.items.map((item) => (
                                                    <li key={item.id}>
                                                        {item.id.toLocaleLowerCase() !==
                                                            item.title.toLocaleLowerCase() && (
                                                            <span className="mr-2 text-xs text-cyan-700 dark:text-cyan-300">
                                                                {item.id}
                                                            </span>
                                                        )}
                                                        {item.href ? (
                                                            <a
                                                                className="th-link text-(--th-bright)"
                                                                href={item.href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {item.title}
                                                            </a>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    item.kind === "directory"
                                                                        ? "text-cyan-700 dark:text-cyan-300"
                                                                        : undefined
                                                                }
                                                            >
                                                                {item.title}
                                                            </span>
                                                        )}
                                                        {item.detail && (
                                                            <p className="text-xs leading-5 text-(--th-dim)">
                                                                {item.detail}
                                                            </p>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                }
                                if (entry.type === "link") {
                                    return (
                                        <p key={`${entry.type}-${index}`}>
                                            <span className="text-(--th-dim)">{entry.text} </span>
                                            <a
                                                className="th-link text-(--th-bright)"
                                                href={entry.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {entry.label}
                                            </a>
                                        </p>
                                    );
                                }
                                if (entry.type === "banner") {
                                    return (
                                        <pre
                                            key={`${entry.type}-${index}`}
                                            className="max-w-full overflow-x-auto text-[0.5rem] leading-tight text-(--cli-site-accent) sm:text-xs"
                                        >
                                            {entry.text}
                                        </pre>
                                    );
                                }
                                if (entry.type === "command") {
                                    return (
                                        <p key={`${entry.type}-${index}`}>
                                            <span className="text-emerald-700 dark:text-emerald-300">
                                                ➜
                                            </span>
                                            <span className="text-(--th-text)"> </span>
                                            <span className="text-cyan-700 dark:text-cyan-300">
                                                {entry.path}
                                            </span>
                                            <span className="text-(--th-text)"> {entry.text}</span>
                                        </p>
                                    );
                                }
                                return (
                                    <p
                                        key={`${entry.type}-${index}`}
                                        className={
                                            entry.type === "error"
                                                ? "text-red-500 dark:text-red-300"
                                                : "whitespace-pre-wrap"
                                        }
                                    >
                                        {entry.text}
                                    </p>
                                );
                            })}
                        </div>

                        <form
                            className={pendingLocale ? "mt-1" : "mt-4"}
                            onSubmit={(event) => {
                                event.preventDefault();
                                submit(input);
                            }}
                        >
                            {suggestions.length > 0 && (
                                <p className="mb-2 text-xs text-cyan-700 dark:text-cyan-300">
                                    {suggestions.slice(0, 8).join("   ")}
                                </p>
                            )}
                            <label
                                className={`flex items-center text-sm ${pendingLocale ? "gap-1" : "gap-2"}`}
                            >
                                <span className="shrink-0">
                                    {pendingLocale ? (
                                        <span className="text-(--th-text)">
                                            {content.copy.localeRestart.replace(
                                                "{language}",
                                                localeName(pendingLocale)
                                            )}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="mr-2 text-emerald-700 dark:text-emerald-300">
                                                ➜
                                            </span>
                                            <span className="text-cyan-700 dark:text-cyan-300">
                                                {displayPath(cwd)}
                                            </span>
                                        </>
                                    )}
                                </span>
                                <span className="sr-only">
                                    {pendingLocale ? "Locale restart confirmation" : "CLI command"}
                                </span>
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(event) => {
                                        setInput(event.target.value);
                                        setSuggestions([]);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Tab") {
                                            event.preventDefault();
                                            complete();
                                        } else if (event.key === "ArrowUp") {
                                            event.preventDefault();
                                            const nextIndex =
                                                historyIndex === null
                                                    ? history.length - 1
                                                    : Math.max(0, historyIndex - 1);
                                            if (history[nextIndex]) {
                                                setInput(history[nextIndex]);
                                                setHistoryIndex(nextIndex);
                                            }
                                        } else if (event.key === "ArrowDown") {
                                            event.preventDefault();
                                            if (historyIndex === null) return;
                                            const nextIndex = historyIndex + 1;
                                            if (nextIndex >= history.length) {
                                                setInput("");
                                                setHistoryIndex(null);
                                            } else {
                                                setInput(history[nextIndex]);
                                                setHistoryIndex(nextIndex);
                                            }
                                        } else if (
                                            event.key.toLowerCase() === "l" &&
                                            (event.ctrlKey || event.metaKey)
                                        ) {
                                            event.preventDefault();
                                            setOutput([]);
                                        } else if (event.key === "Escape") {
                                            setSuggestions([]);
                                        }
                                    }}
                                    autoComplete="off"
                                    spellCheck="false"
                                    className="min-w-0 flex-1 bg-transparent text-(--th-bright) outline-none placeholder:text-(--th-dim)"
                                    placeholder={pendingLocale ? "" : "help"}
                                />
                            </label>
                        </form>
                    </div>
                </section>
            </main>
        </TerminalCliViewTransition>
    );
}
