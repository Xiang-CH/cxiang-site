import { getTranslations } from "next-intl/server";
import Image from "next/image";
import TocWheel from "@/components/toc-wheel";

export default async function MainContent() {
    const t = await getTranslations("main");

    const menuItems = [
        { href: "about", label: t("about.label") },
        { href: "education", label: t("education.label") },
        { href: "experience", label: t("experience.label") },
        { href: "projects", label: t("projects.label") },
        { href: "contact", label: t("contact.label") },
    ];

    return (
        <div className="flex items-start gap-4 px-6 md:px-20 pt-4 transition-all bg-background">
            <TocWheel
                Sections={menuItems}
            />
            <div className="md:w-[50%]">
                <ContentSection id="about">
                    <HeadingContent content={t("about.label")} />
                    <TextContent localKey="about.content" />
                </ContentSection>
                <ContentSection id="education">
                    <HeadingContent content={t("education.label")} />
                    <EducationCards
                        programs={t.raw("education.programs")}
                    />
                </ContentSection>
                <ContentSection id="experience">
                    <h1 className="text-3xl font-bold transition-all fade-in">Experience</h1>
                </ContentSection>
                <ContentSection id="projects">
                    <h1 className="text-3xl font-bold transition-all fade-in">Projects</h1>
                </ContentSection>
                <ContentSection id="contact">
                    <h1 className="text-3xl font-bold transition-all fade-in">Contact</h1>
                </ContentSection>
            </div>
        </div>
    );
}

function ContentSection({ children, id }: { children: React.ReactNode; id: string }) {
    return (
        <div
            className={`snap-center ${id === 'education' || id === 'projects' ? 'h-[60vh]' : 'h-[calc(100vh-3.5rem)]'} flex flex-col justify-center content-section pb-10 min-h-[25rem]`}
            id={id}
        >
            <div className="mt-4 transition-all">{children}</div>
        </div>
    );
}

function HeadingContent({ content }: { content: string }){
    return <h1 className="text-3xl font-bold transition-all md:hidden">{content}</h1>
}


async function TextContent({ localKey }: { localKey: string }){
    const t = await getTranslations("main");

    return <p className="leading-7 [&:not(:first-child)]:mt-6 whitespace-pre-wrap max-w-2xl">
        {t.rich(localKey, {
            b: (chunks) => <b>{chunks}</b>,
            em: (chunks) => <em>{chunks}</em>,
            a: (chunks) => <a href={t(`${localKey}Href`)}>{chunks}</a>
        }) }
    </p>
}

type EducationDetails = {
    degree: string;
    institution: string;
    duration: string;
    logo: string;
};

async function EducationCards({ programs }: { programs: EducationDetails[] }) {
    return (
        <div className="flex [&:not(:first-child)]:mt-6 flex-col gap-4 max-w-2xl">
            {programs.map((program, index) => {
                return (
                    <div key={index} className="flex gap-4 border p-4 rounded-lg relative">
                        <div className="flex items-center justify-center">
                            <Image
                                src={`${program.logo}`}
                                alt={program.institution}
                                width={40}
                                height={40}
                                className="min-w-16 dark:invert-100"
                            />
                        </div>
                        <div className="overflow-hidden flex flex-col gap-1">
                            <h2 className="text-xl font-bold truncate">{program.institution}</h2>
                            <p className="text-gray-600 whitespace-pre-wrap leading-5">{program.degree}</p>
                            <p className="text-gray-600">{program.duration}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
