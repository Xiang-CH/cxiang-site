import { getTranslations, setRequestLocale } from "next-intl/server";
import TerminalHomeClient from "./_components/terminal-home-client";
import type { TerminalContent } from "./_components/terminal-home-client";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chen Xiang (陈想) | Personal Website",
    description: "Personal website and portfolio of Chen Xiang, showcasing projects and experience",
    openGraph: {
        title: "Chen Xiang | Personal Website",
        description: "Portfolio and personal website of Chen Xiang",
        type: "website",
    },
};

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations();

    type OrgEntry = { position: string; company: string; website: string; duration: string };
    const orgs: OrgEntry[] = t.raw("main.experience.organizations") as OrgEntry[];

    const content: TerminalContent = {
        locale,
        agentMsg: t("terminal.agentMsg"),
        name: t("intro.name"),
        nameSecondary: t("intro.nameSecondary"),
        typedRole: t("terminal.typedRole"),
        sysInit: t("terminal.sysInit"),
        sysKernel: t("terminal.sysKernel"),
        links: t.raw("intro.links"),
        loadingMsg: t("terminal.loadingMsg"),
        about: t("terminal.about"),
        stack: t("terminal.stack"),
        contactIntro: t("terminal.contactIntro"),
        sectionLabels: {
            about: t("main.about.label"),
            skills: t("main.skills.label"),
            experience: t("main.experience.label"),
            contact: t("main.contact.label"),
        },
        skillLabels: {
            languages: t("main.skills.languages"),
            frameworks: t("main.skills.frameworks"),
            tools: t("main.skills.tools"),
        },
        experience: orgs.map((o, i) => ({
            role: o.position,
            org: o.company,
            period: o.duration,
            website: o.website,
            commit: i === 0 ? "a7f3c2e" : "1b9d4f8",
        })),
    };

    return <TerminalHomeClient content={content} />;
}
