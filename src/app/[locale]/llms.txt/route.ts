import { getTranslations } from "next-intl/server";

export async function GET() {
    const t = await getTranslations();

    type OrgEntry = { position: string; company: string; website: string; duration: string };
    const orgs = t.raw("main.experience.organizations") as OrgEntry[];

    const skills = {
        languages: ["TypeScript", "JavaScript", "Python", "SQL"],
        frameworks: [
            "React",
            "Next.js",
            "Tailwind CSS",
            "Node.js",
            "Prisma",
            "Flask",
            "FastAPI",
            "NumPy",
            "Pandas",
            "PyTorch",
        ],
        tools: ["Git", "Docker", "Linux", "Azure", "AWS", "Vercel", "Cloudflare", "Postman"],
    };

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
${skills.languages.join(", ")}

### ${fwLabel}
${skills.frameworks.join(", ")}

### ${toolsLabel}
${skills.tools.join(", ")}

## ${experienceLabel}

${orgs.map((o) => `- **${o.position}** at ${o.company} (${o.duration})\n  ${o.website}`).join("\n\n")}

## ${contactLabel}

${contactIntro}

- Email: xiiang.ch@gmail.com
- GitHub: https://github.com/Xiang-CH
- LinkedIn: https://www.linkedin.com/in/xiang-chen-62389526a/
- Instagram: https://www.instagram.com/chen.xiiang/

## Site Map
- [My Projects](/projects)
- [My Blog](/blog)
`;

    return new Response(text, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}
