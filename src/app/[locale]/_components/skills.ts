export type SkillItem = {
    name: string;
    href: string;
};

export const skills: {
    languages: SkillItem[];
    frameworks: SkillItem[];
    tools: SkillItem[];
} = {
    languages: [
        { name: "TypeScript", href: "https://www.typescriptlang.org/" },
        { name: "JavaScript", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
        { name: "Python", href: "https://www.python.org/" },
        { name: "SQL", href: "https://developer.mozilla.org/en-US/docs/Glossary/SQL" },
    ],
    frameworks: [
        { name: "React", href: "https://react.dev/" },
        { name: "Next.js", href: "https://nextjs.org/" },
        { name: "Tailwind CSS", href: "https://tailwindcss.com/" },
        { name: "Node.js", href: "https://nodejs.org/" },
        { name: "Prisma", href: "https://www.prisma.io/" },
        { name: "Flask", href: "https://flask.palletsprojects.com/" },
        { name: "FastAPI", href: "https://fastapi.tiangolo.com/" },
        { name: "NumPy", href: "https://numpy.org/" },
        { name: "Pandas", href: "https://pandas.pydata.org/" },
        { name: "PyTorch", href: "https://pytorch.org/" },
    ],
    tools: [
        { name: "Git", href: "https://git-scm.com/" },
        { name: "Docker", href: "https://www.docker.com/" },
        { name: "Linux", href: "https://www.kernel.org/" },
        { name: "Azure", href: "https://azure.microsoft.com/" },
        { name: "AWS", href: "https://aws.amazon.com/" },
        { name: "Aliyun", href: "https://www.aliyun.com/" },
        { name: "Vercel", href: "https://vercel.com/" },
        { name: "Cloudflare", href: "https://www.cloudflare.com/" },
        { name: "Postman", href: "https://www.postman.com/" },
    ],
};
