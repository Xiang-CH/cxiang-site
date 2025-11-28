import { getTranslations } from "next-intl/server";

const skillsList = [
    {
        headingKey: "languages",
        skills: [
            {
                name: "TypeScript",
                icon: "/typescript/typescript-original.svg",
            },
            {
                name: "JavaScript",
                icon: "/javascript/javascript-original.svg",
            },
            {
                name: "Python",
                icon: "/python/python-original.svg",
            },
            { name: "SQL", icon: "/mysql/mysql-original.svg" },
        ],
    },
    {
        headingKey: "frameworks",
        skills: [
            {
                name: "React",
                icon: "/react/react-original.svg",
            },
            {
                name: "Next.js",
                icon: "/nextjs/nextjs-original.svg",
            },
            {
                name: "Tailwind",
                icon: "/tailwindcss/tailwindcss-original.svg",
            },
            {
                name: "Node.js",
                icon: "/nodejs/nodejs-original.svg",
            },
            {
                name: "Prisma",
                icon: "/prisma/prisma-original.svg",
                invertOnDark: true,
            },
            {
                name: "Flask",
                icon: "/flask/flask-original.svg",
                invertOnDark: true,
            },
            {
                name: "FastAPI",
                icon: "/fastapi/fastapi-original.svg",
            },
            {
                name: "NumPy",
                icon: "/numpy/numpy-original.svg",
            },
            {
                name: "Pandas",
                icon: "/pandas/pandas-original.svg",
            },
            {
                name: "PyTorch",
                icon: "/pytorch/pytorch-original.svg",
            },
        ],
    },
    {
        headingKey: "tools",
        skills: [
            {
                name: "Git",
                icon: "/git/git-original.svg",
            },
            {
                name: "Docker",
                icon: "/docker/docker-original.svg",
            },
            {
                name: "Linux",
                icon: "/linux/linux-original.svg",
            },
            {
                name: "Azure",
                icon: "/azure/azure-original.svg",
            },
            {
                name: "AWS",
                icon: "/amazonwebservices/amazonwebservices-original-wordmark.svg",
                darkIcon: "/amazonwebservices/amazonwebservices-plain-wordmark.svg",
            },
            {
                name: "Vercel",
                icon: "/vercel/vercel-original.svg",
                invertOnDark: true,
            },
            {
                name: "Cloudflare",
                icon: "/cloudflare/cloudflare-original.svg",
            },
            {
                name: "Postman",
                icon: "/postman/postman-original.svg",
            },
        ],
    },
];

export default async function Skills() {
    const t = await getTranslations("main");

    return (
        <div className="mt-4 flex flex-col gap-6 sm:gap-8 [&:not(:first-child)]:mt-6">
            {skillsList.map((section) => (
                <div key={section.headingKey} className="flex flex-col gap-4">
                    <h2 className="leading-7 text-2xl font-semibold">
                        {t(`skills.${section.headingKey}`)}
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {section.skills.map((skill) => (
                            <div
                                key={skill.name}
                                className="flex flex-col items-center w-14 sm:w-18"
                            >
                                <picture>
                                    <source
                                        srcSet={
                                            "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/" +
                                            skill.icon
                                        }
                                        media="(prefers-color-scheme: light)"
                                    />
                                    <source
                                        srcSet={
                                            "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/" +
                                            (skill.darkIcon ? skill.darkIcon : skill.icon)
                                        }
                                        media="(prefers-color-scheme: dark)"
                                    />
                                    <img
                                        srcSet={
                                            "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/" +
                                            skill.icon
                                        }
                                        alt={skill.name}
                                        className={`w-8 h-8 mb-1 ${skill.invertOnDark ? "dark:invert" : ""}`}
                                        loading="lazy"
                                    />
                                </picture>

                                <span className="text-sm text-center">{skill.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
