import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import info from "@/lib/info";
import { getCliCatalog } from "@/lib/portfolio-catalog";
import { createPageMetadata } from "@/lib/seo";
import { skills } from "../_components/skills";
import PortfolioCli, { type CliContent } from "./_components/portfolio-cli";

type Props = {
    params: Promise<{ locale: string }>;
};

function cliPath(locale: string): string {
    return locale === "en" ? "/cli" : `/${locale}/cli`;
}

function formatLastUpdate(locale: string): string {
    const timestamp = process.env.NEXT_PUBLIC_LAST_UPDATE_AT;
    const date = timestamp ? new Date(timestamp) : null;
    if (!date || Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(date) + " UTC";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale });

    return createPageMetadata({
        title: t("terminal.cli.title"),
        description: t("terminal.cli.description"),
        pathname: cliPath(locale),
    });
}

export default async function CliPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);

    const [t, catalog] = await Promise.all([getTranslations({ locale }), getCliCatalog()]);
    const lastUpdate = formatLastUpdate(locale);
    type OrgEntry = {
        position: string;
        company: string;
        website: string;
        duration: string;
        commit: string;
    };
    const organizations = t.raw("main.experience.organizations") as OrgEntry[];

    const content: CliContent = {
        locale,
        homeHref: locale === "en" ? "/" : `/${locale}`,
        name: t("intro.name"),
        role: t("intro.role"),
        about: t("terminal.about"),
        stack: t("terminal.stack"),
        experience: organizations.map((organization) => ({
            role: organization.position,
            org: organization.company,
            period: organization.duration,
            website: organization.website,
            commit: organization.commit,
        })),
        skills: [
            { label: t("main.skills.languages"), items: skills.languages },
            { label: t("main.skills.frameworks"), items: skills.frameworks },
            { label: t("main.skills.tools"), items: skills.tools },
        ],
        contacts: [
            { label: "email", value: info.email.content, href: info.email.href },
            { label: "github", value: info.github.content, href: info.github.href },
            { label: "linkedin", value: info.linkedin.content, href: info.linkedin.href },
            { label: "instagram", value: info.instagram.content, href: info.instagram.href },
            { label: "resume", value: info.resume.content, href: info.resume.href },
            { label: "x", value: "@cxiiang", href: "https://x.com/cxiiang" },
        ],
        catalog,
        copy: {
            title: t("terminal.cli.title"),
            prompt: t("terminal.cli.prompt"),
            lastUpdate: t("terminal.cli.lastUpdate", { date: lastUpdate }),
            welcome: t("terminal.cli.welcome"),
            commandHint: t("terminal.cli.commandHint"),
            commands: t("terminal.cli.commands"),
            files: t("terminal.cli.files"),
            emptyProjects: t("terminal.cli.emptyProjects"),
            emptyBlog: t("terminal.cli.emptyBlog"),
            unavailable: t("terminal.cli.unavailable"),
            noMatches: t("terminal.cli.noMatches"),
            unknownCommand: t("terminal.cli.unknownCommand"),
            missingArgument: t("terminal.cli.missingArgument"),
            invalidPath: t("terminal.cli.invalidPath"),
            invalidIndex: t("terminal.cli.invalidIndex"),
            nothingToGrep: t("terminal.cli.nothingToGrep"),
            opened: t("terminal.cli.opened"),
            openUnavailable: t("terminal.cli.openUnavailable"),
            exit: t("terminal.cli.exit"),
            returnHome: t("terminal.cli.returnHome"),
            historyEmpty: t("terminal.cli.historyEmpty"),
            searchUsage: t("terminal.cli.searchUsage"),
            grepUsage: t("terminal.cli.grepUsage"),
            commandUsage: t("terminal.cli.commandUsage"),
            localeUsage: t("terminal.cli.localeUsage"),
            localeRestart: t.raw("terminal.cli.localeRestart") as string,
            localeCancelled: t("terminal.cli.localeCancelled"),
            fileExists: t("terminal.cli.fileExists"),
            notDirectory: t("terminal.cli.notDirectory"),
            parentMissing: t("terminal.cli.parentMissing"),
            redirectionUsage: t("terminal.cli.redirectionUsage"),
            labels: {
                projects: t("terminal.cli.labels.projects"),
                blog: t("terminal.cli.labels.blog"),
                experience: t("terminal.cli.labels.experience"),
                skills: t("terminal.cli.labels.skills"),
                contact: t("terminal.cli.labels.contact"),
                date: t("terminal.cli.labels.date"),
                english: t("terminal.cli.labels.english"),
                chinese: t("terminal.cli.labels.chinese"),
            },
        },
    };

    return <PortfolioCli content={content} />;
}
