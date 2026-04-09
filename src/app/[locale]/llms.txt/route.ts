import { getTranslations } from "next-intl/server";
import { cacheLife, cacheTag } from "next/cache";
import { routing } from "@/i18n/routing";
import { skills } from "@/app/[locale]/_components/skills";
import { CACHE_TAGS, getLlmsTag } from "@/lib/cache-tags";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

async function buildLlmsText(locale: string): Promise<string> {
    "use cache";
    cacheLife("weeks");
    cacheTag(CACHE_TAGS.llms, getLlmsTag(locale));
    const t = await getTranslations({ locale });

    type OrgEntry = { position: string; company: string; website: string; duration: string };
    const orgs = t.raw("main.experience.organizations") as OrgEntry[];

    const name = t("intro.name");
    const nameSecondary = t("intro.nameSecondary");
    const role = t("terminal.typedRole");
    const about = t("terminal.about").replace(/\n/g, " ");
    const stack = t("terminal.stack");
    const contactIntro = t("terminal.contactIntro");
    const aboutLabel = t("main.about.label");
    const skillsLabel = t("main.skills.label");
    const experienceLabel = t("main.experience.label");
    const contactLabel = t("main.contact.label");
    const langLabel = t("main.skills.languages");
    const fwLabel = t("main.skills.frameworks");
    const toolsLabel = t("main.skills.tools");

    const text = `# ${name} (${nameSecondary})
    

> ${role}

- Résumé: https://cdn.cxiang.site/resume_chen_xiang.pdf

## ${aboutLabel}

${about}
${stack}

## ${skillsLabel}

### ${langLabel}
${skills.languages.map((l) => l.name).join(", ")}

### ${fwLabel}
${skills.frameworks.map((f) => f.name).join(", ")}

### ${toolsLabel}
${skills.tools.map((t) => t.name).join(", ")}

## ${experienceLabel}

${orgs.map((o) => `- **${o.position}** at ${o.company} (${o.duration})\n  ${o.website}`).join("\n\n")}

## ${contactLabel}

${contactIntro}

- Email: xiiang.ch@gmail.com
- GitHub: https://github.com/Xiang-CH
- LinkedIn: https://www.linkedin.com/in/xiang-chen-62389526a/
- Instagram: https://www.instagram.com/chen.xiiang/

## Site Map
- [My Projects](/project)
- [My Blog](/blog)
`;

    return text;
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const text = await buildLlmsText(locale);
    return new Response(text, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}
