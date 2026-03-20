"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { skills } from "./skills";
import {
    GitHubLogoIcon,
    LinkedInLogoIcon,
    EnvelopeClosedIcon,
    FileTextIcon,
} from "@radix-ui/react-icons";

export type TerminalContent = {
    locale: string;
    onboarding: string;
    systemInfo: string;
    agentMsg: string;
    name: string;
    nameSecondary: string;
    typedRole: string;
    sysInit: string;
    sysKernel: string;
    links: {
        github: string;
        linkedin: string;
        email: string;
        resume: string;
    };
    about: string;
    stack: string;
    contactIntro: string;
    sectionLabels: {
        about: string;
        skills: string;
        experience: string;
        contact: string;
    };
    skillLabels: {
        languages: string;
        frameworks: string;
        tools: string;
    };
    experience: Array<{
        role: string;
        org: string;
        period: string;
        website: string;
        commit: string;
    }>;
};

function Box({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="relative border border-(--th-border) p-[clamp(0.75rem,2vw,1.25rem)] mb-8">
            <span className="absolute top-[-0.6em] left-4 bg-(--th-bg) px-[0.4em] text-[0.65rem] tracking-[0.2em] uppercase text-(--th-dim)">
                {label}
            </span>
            {children}
        </div>
    );
}

function Cmd({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[0.72rem] text-(--th-accent) tracking-[0.2em] uppercase mb-2">
            {children}
        </p>
    );
}

export default function TerminalHomeClient({ content }: { content: TerminalContent }) {
    const [cursorVisible, setCursorVisible] = useState(true);
    const [typed, setTyped] = useState("");
    const fullText = content.typedRole;

    useEffect(() => {
        const id = setInterval(() => setCursorVisible((v) => !v), 530);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        setTyped("");
        let i = 0;
        const id = setInterval(() => {
            if (i <= fullText.length) {
                setTyped(fullText.slice(0, i));
                i++;
            } else {
                clearInterval(id);
            }
        }, 55);
        return () => clearInterval(id);
    }, [fullText]);

    return (
        <main
            className="terminal-page min-h-screen bg-(--th-bg) text-(--th-text) pt-2 pb-8 px-4"
            style={{ fontFamily: "'JetBrains Mono', 'Geist Mono', 'Fira Mono', monospace" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');

                /* ── Dark palette (default) ── */
                .terminal-page {
                    --th-bg: var(--background);
                    --th-text: #cccfc8;
                    --th-dim: rgba(205, 192, 168, 0.534);
                    --th-bright: #e8e4de;
                    --th-accent: #c8a45a;
                    --th-border: rgba(183,179,170,0.28);
                    --th-skill-hover: rgba(245,208,128,0.07);
                    --th-link-ul: rgba(245,208,128,0.32);
                }

                /* ── Light palette ── */
                :root:not(.dark) .terminal-page {
                    --th-bg: var(--background);
                    --th-text: #3b3328;
                    --th-dim: rgba(90,75,55,0.55);
                    --th-bright: #1a1208;
                    --th-accent: #8b5e1a;
                    --th-border: rgba(120,100,70,0.28);
                    --th-skill-hover: rgba(139,94,26,0.07);
                    --th-link-ul: rgba(139,94,26,0.35);
                }

                .th-skill { display: inline-block; border: 1px solid var(--th-border); padding: 0.15em 0.5em; font-size: 0.75rem; margin: 0.15em; transition: all 0.15s; cursor: default; }
                .th-skill:hover { border-color: var(--th-bright); background: var(--th-skill-hover); color: var(--th-bright); }
                .th-link { color: var(--th-bright); text-decoration: none; border-bottom: 1px solid var(--th-link-ul); transition: border-color 0.15s; }
                .th-link:hover { border-color: var(--th-accent); }
            `}</style>

            <div className="relative z-1 max-w-215 mx-auto">
                {/* ── Locale Onboarding ───────────────── */}
                <Box label={content.onboarding}>
                    {/*<Cmd>$ select --language</Cmd>*/}
                    <div className="flex gap-4 flex-wrap">
                        {Object.entries(locales).map(([code, name]) => {
                            const isActive = code === content.locale;
                            return (
                                <Link
                                    key={code}
                                    href="/"
                                    locale={code}
                                    className={`no-underline text-[0.88rem] transition-[color,border-color] duration-150 border-b ${
                                        isActive
                                            ? "text-(--th-text) font-bold border-b-(--th-accent)"
                                            : "text-(--th-dim) font-normal border-b-(--th-link-ul)"
                                    }`}
                                >
                                    {name}
                                </Link>
                            );
                        })}
                    </div>
                </Box>

                {/* ── Boot / Identity ─────────────────── */}
                <Box label={content.systemInfo}>
                    <p className="text-[0.7rem] text-(--th-dim) mb-[0.4rem]">{content.sysInit}</p>
                    <p className="text-[0.7rem] text-(--th-dim) mb-[0.4rem]">
                        {content.agentMsg}{" "}
                        <Link href="/llms.txt" className="text-(--th-dim)! th-link">
                            /llms.txt
                        </Link>
                    </p>
                    <p className="text-[0.7rem] text-(--th-dim) mb-4">{content.sysKernel}</p>
                    <Cmd>$ whoami</Cmd>
                    <div className="pl-4 border-l-2 border-l-[rgba(200,164,90,0.22)]">
                        <p className="text-[clamp(2.4rem,5vw,3.2rem)] font-bold leading-none text-(--th-bright) tracking-[-0.02em]">
                            {content.name}{" "}
                            <span className="opacity-35 font-light text-[0.55em]">
                                {content.nameSecondary}
                            </span>
                        </p>
                        <p className="text-[clamp(0.8rem,1.8vw,1rem)] text-(--th-accent) mt-[0.3rem]">
                            {typed}
                            <span className={cursorVisible ? "opacity-100" : "opacity-0"}>▌</span>
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap mt-5 text-sm sm:text-base">
                        {[
                            {
                                label: content.links.github,
                                href: "https://github.com/Xiang-CH",
                                icon: <GitHubLogoIcon width={13} />,
                            },
                            {
                                label: content.links.linkedin,
                                href: "https://www.linkedin.com/in/xiang-chen-62389526a/",
                                icon: <LinkedInLogoIcon width={13} />,
                            },
                            {
                                label: content.links.email,
                                href: "mailto:xiiang.ch@gmail.com",
                                icon: <EnvelopeClosedIcon width={13} />,
                            },
                            {
                                label: content.links.resume,
                                href: "https://cdn.cxiang.site/resume_chen_xiang.pdf",
                                icon: <FileTextIcon width={13} />,
                            },
                        ].map((l) => (
                            <a
                                key={l.label}
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="th-link flex items-center gap-1"
                            >
                                {l.icon} <span>{l.label}</span>
                            </a>
                        ))}
                    </div>
                </Box>

                {/* ── About ────────────────────────────── */}
                <Box label={content.sectionLabels.about}>
                    <Cmd>$ cat about.txt</Cmd>
                    {content.about.split("\n").map((line, i) => (
                        <p
                            key={i}
                            className={`text-[clamp(0.85rem,1.8vw,0.97rem)] leading-[1.6] text-(--th-text)${i > 0 ? " mt-4" : ""}`}
                        >
                            {line}
                        </p>
                    ))}
                    <p className="text-[clamp(0.85rem,1.8vw,0.97rem)] leading-[1.6] text-(--th-text) mt-4">
                        {content.stack}
                    </p>
                </Box>

                {/* ── Experience ───────────────────────── */}
                <Box label={content.sectionLabels.experience}>
                    <Cmd>$ git log --oneline --experience</Cmd>
                    {content.experience.map((e) => (
                        <div
                            key={e.commit}
                            className="pl-4 border-l-2 border-l-[rgba(200,164,90,0.22)] mb-5"
                        >
                            <p className="text-[0.65rem] text-(--th-accent) mb-[0.15rem]">
                                commit {e.commit}
                            </p>
                            <p className="text-[clamp(0.85rem,1.8vw,0.97rem)] font-bold text-(--th-bright) mb-[0.15rem]">
                                {e.role}
                            </p>
                            <a
                                href={e.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="th-link text-[0.82rem]"
                            >
                                {e.org}
                            </a>
                            <p className="text-[0.72rem] text-(--th-dim) mt-[0.15rem]">
                                {e.period}
                            </p>
                        </div>
                    ))}
                </Box>

                {/* ── Skills ───────────────────────────── */}
                <Box label={content.sectionLabels.skills}>
                    <Cmd>$ ls ./skills/</Cmd>
                    <div className="flex flex-col gap-4">
                        {[
                            { label: content.skillLabels.languages, items: skills.languages },
                            { label: content.skillLabels.frameworks, items: skills.frameworks },
                            { label: content.skillLabels.tools, items: skills.tools },
                        ].map((s) => (
                            <div key={s.label}>
                                <p className="flex items-center gap-2 text-[0.75rem] text-(--th-dim) mb-[0.4rem]">
                                    <span className="text-(--th-accent) select-none">◇</span>
                                    {s.label}/
                                </p>
                                <div className="flex">
                                    <div className="ml-[0.2rem] pl-5 border-l border-(--th-border)" />
                                    <div className="flex flex-wrap">
                                        {s.items.map((sk) => (
                                            <span key={sk} className="th-skill">
                                                {sk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Box>

                {/* ── Contact ──────────────────────────── */}
                <Box label={content.sectionLabels.contact}>
                    <Cmd>$ cat contact.json</Cmd>
                    {/*<p className="text-[0.78rem] text-(--th-dim) mb-3">{content.contactIntro}</p>*/}
                    <div className="text-[clamp(0.78rem,1.6vw,0.9rem)] leading-loose">
                        <p className="text-(--th-dim)">{"{"}</p>
                        {[
                            {
                                key: "_comment",
                                value: content.contactIntro,
                            },
                            {
                                key: "email",
                                value: "xiiang.ch@gmail.com",
                                href: "mailto:xiiang.ch@gmail.com",
                            },
                            {
                                key: "github",
                                value: "Xiang-CH",
                                href: "https://github.com/Xiang-CH",
                            },
                            {
                                key: "linkedin",
                                value: "Xiang Chen",
                                href: "https://www.linkedin.com/in/xiang-chen-62389526a/",
                            },
                            {
                                key: "instagram",
                                value: "@chen.xiiang",
                                href: "https://www.instagram.com/chen.xiiang/",
                            },
                        ].map((c, i, arr) => (
                            <p key={c.key} className="pl-6">
                                <span className="text-(--th-dim)">&quot;</span>
                                <span className="text-(--th-accent)">{c.key}</span>
                                <span className="text-(--th-dim)">&quot;: &quot;</span>
                                <a
                                    href={c.href}
                                    target={c.href ? "_blank" : undefined}
                                    rel="noopener noreferrer"
                                    className={c.href ? "th-link" : ""}
                                >
                                    {c.value}
                                </a>
                                <span className="text-(--th-dim)">&quot;</span>
                                {i < arr.length - 1 && <span className="text-(--th-dim)">,</span>}
                            </p>
                        ))}
                        <p className="text-(--th-dim)">{"}"}</p>
                    </div>
                </Box>
            </div>
        </main>
    );
}
