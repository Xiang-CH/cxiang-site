import "./terminal-home-client.css";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { skills } from "./skills";
import { TypewriterText } from "./typewriter-text-client";
import {
    GitHubLogoIcon,
    LinkedInLogoIcon,
    EnvelopeClosedIcon,
    FileTextIcon,
} from "@radix-ui/react-icons";
import Shuffle from "@/components/shuffle";

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
    const fullText = content.typedRole;

    return (
        <main
            className={`font-mono terminal-page min-h-screen bg-(--th-bg) text-(--th-text) pt-2 pb-8 px-4`}
        >
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
                    <div className="pl-4 border-l-2 border-l-[rgba(200,164,90,0.22)] pt-2">
                        <Shuffle
                            text="Chen Xiang"
                            shuffleDirection="right"
                            duration={0.35}
                            animationMode="evenodd"
                            shuffleTimes={1}
                            ease="power3.out"
                            stagger={0.03}
                            threshold={0.1}
                            triggerOnce={true}
                            triggerOnHover
                            respectReducedMotion={true}
                            loop={false}
                            loopDelay={10}
                            textAlign="left"
                            className="text-[3rem] tracking-tighter"
                        />
                        {content.locale != "en" && (
                            <p className="text-[clamp(1.5rem,2vw,2.5rem)] opacity-40 leading-none">
                                <TypewriterText key={content.name} text={content.name} noCursor />
                            </p>
                        )}
                        <p className="text-[clamp(0.8rem,1.8vw,1rem)] text-(--th-accent) mt-1">
                            <TypewriterText key={fullText} text={fullText} />
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
                    <Cmd>$ git log --experience</Cmd>
                    {content.experience.map((e) => (
                        <div
                            key={e.commit}
                            className="pl-4 border-l-2 border-l-[rgba(200,164,90,0.22)] mb-5"
                        >
                            <p className="text-[0.65rem] text-(--th-accent) mb-[0.15rem]">
                                commit {e.commit}
                            </p>
                            <p className="text-[clamp(0.85rem,1.8vw,0.97rem)] font-bold text-(--th-bright)">
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
                                            <a
                                                key={sk.name}
                                                href={sk.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="th-skill"
                                            >
                                                {sk.name}
                                            </a>
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
