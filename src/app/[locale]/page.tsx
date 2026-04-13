import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BreadcrumbJsonLd from "@/components/breadcrumb-json-ld";
import { BREADCRUMB_SITE_URL } from "@/lib/breadcrumb-json-ld";
import { createPageMetadata, getLocalePath } from "@/lib/seo";
import TerminalHomeClient from "./_components/terminal-home-client";
import type { TerminalContent } from "./_components/terminal-home-client";

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    const isChinese = locale === "zh-CN";
    // const title = SITE_NAME;
    const description = isChinese
        ? "陈想的个人网站，你可以在这里找到我的全栈软件项目、经验、技术文章，以及我的‘Vibes’。"
        : "Personal website of Chen Xiang, featuring full-stack software engineering projects, experience, technical writing, and my vibes.";

    return createPageMetadata({
        // title,
        description,
        pathname: getLocalePath(locale),
        includeLocaleAlternates: true,
    });
}

export default async function Home({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations();

    type OrgEntry = { position: string; company: string; website: string; duration: string };
    const orgs: OrgEntry[] = t.raw("main.experience.organizations") as OrgEntry[];

    const content: TerminalContent = {
        locale,
        onboarding: t("terminal.onboarding"),
        systemInfo: t("terminal.systemInfo"),
        agentMsg: t("terminal.agentMsg"),
        name: t("intro.name"),
        nameSecondary: t("intro.nameSecondary"),
        typedRole: t("terminal.typedRole"),
        sysInit: t("terminal.sysInit"),
        sysKernel: t("terminal.sysKernel"),
        links: t.raw("intro.links"),
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

    return (
        <>
            <BreadcrumbJsonLd
                entries={[{ name: "Home", item: BREADCRUMB_SITE_URL }, { name: t("intro.name") }]}
            />
            <TerminalHomeClient content={content} />
        </>
    );
}
