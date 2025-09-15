import { getTranslations } from "next-intl/server";
import Skills from "./skills";
import TocWheel from "@/components/toc-wheel";
import Image from "next/image";
import { EnvelopeClosedIcon, GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";

export default async function MainContent() {
    const t = await getTranslations("main");

    const menuItems = [
        { href: "about", label: t("about.label") },
        { href: "skills", label: t("skills.label") },
        { href: "experience", label: t("experience.label") },
        { href: "projects", label: t("projects.label") },
        { href: "contact", label: t("contact.label") },
    ];

    return (
        <div className="flex items-start gap-4 px-6 md:px-20 pt-4 transition-all bg-background">
            <TocWheel Sections={menuItems} />
            <div className="md:w-[50%]">
                <ContentSection id="about">
                    <HeadingContent content={t("about.label")} />
                    <TextContent localKey="about.content" />
                </ContentSection>
                <ContentSection id="skills">
                    <HeadingContent content={t("skills.label")} />
                    <Skills />
                </ContentSection>
                <ContentSection id="experience">
                    <HeadingContent content={t("experience.label")} />
                    <ExperienceCards experiences={t.raw("experience.organizations")} />
                </ContentSection>
                <ContentSection id="projects">
                    <HeadingContent content={t("projects.label")} />
                    <TextContent localKey="projects.content" />
                </ContentSection>
                <ContentSection id="contact">
                    <HeadingContent content={t("contact.label")} />
                    <ContactInfo />
                </ContentSection>
            </div>
        </div>
    );
}

function ContentSection({ children, id }: { children: React.ReactNode; id: string }) {
    return (
        <div
            className={`snap-center ${id === "skills" || id === "projects" ? "h-[60dvh]" : "h-[calc(100dvh-3.5rem)]"} flex flex-col justify-center content-section pb-10 min-h-fit`}
            id={id}
        >
            <div className="mt-4 transition-all">{children}</div>
        </div>
    );
}

function HeadingContent({ content }: { content: string }) {
    return <h1 className="text-3xl font-bold transition-all md:hidden">{content}</h1>;
}

async function TextContent({ localKey, className }: { localKey: string; className?: string }) {
    const t = await getTranslations("main");

    return (
        <p
            className={`leading-7 [&:not(:first-child)]:mt-6 whitespace-pre-wrap max-w-2xl ${className}`}
        >
            {t.rich(localKey, {
                b: (chunks) => <b>{chunks}</b>,
                em: (chunks) => <em>{chunks}</em>,
                a: (chunks) => <a href={t(`${localKey}Href`)}>{chunks}</a>,
            })}
        </p>
    );
}

type ExperienceDetails = {
    position: string;
    company: string;
    duration: string;
    logo: string;
    website: string;
};

async function ExperienceCards({ experiences }: { experiences: ExperienceDetails[] }) {
    return (
        <div className="flex [&:not(:first-child)]:mt-6 flex-col gap-4 max-w-2xl">
            {experiences.map((experience, index) => {
                return (
                    <div key={index} className="flex gap-4 border p-4 rounded-lg relative">
                        <div className="flex items-center justify-center">
                            <Image
                                src={`${experience.logo}`}
                                alt={experience.company}
                                width={40}
                                height={40}
                                className="min-w-16 dark:invert-100"
                            />
                        </div>
                        <div className="overflow-hidden flex flex-col gap-1">
                            <h2 className="text-xl font-bold">{experience.position}</h2>
                            <a
                                className="text-gray-600 dark:text-neutral-300 whitespace-pre-wrap leading-5"
                                href={experience.website}
                            >
                                {experience.company}
                            </a>
                            <p className="text-gray-600 dark:text-neutral-300">
                                {experience.duration}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

async function ContactInfo() {
    const contactT = await getTranslations("contact");

    return (
        <>
            <TextContent
                localKey="contact.content"
                className="text-xl font-bold [&:not(:first-child)]:mt-6"
            />
            <a
                href={contactT("email.href")}
                className="flex items-center mt-4 ml-2 py-4 px-6 w-fit hover:underline hover:text-xl transition-all"
            >
                <EnvelopeClosedIcon className="mr-4" width={30} height={30} />
                {contactT("email.content")}
            </a>

            <TextContent localKey="contact.accounts" className="text-xl font-bold" />
            <a
                href={contactT("github.href")}
                className="flex items-center mt-4 ml-2 py-2 px-6 w-fit hover:underline hover:text-xl transition-all"
            >
                <GitHubLogoIcon className="mr-4" width={30} height={30} />
                {contactT("github.content")}
            </a>
            <a
                href={contactT("linkedin.href")}
                className="flex items-center mt-1 ml-2 py-2 px-6 w-fit hover:underline hover:text-xl transition-all"
            >
                <LinkedInLogoIcon className="mr-4" width={30} height={30} />
                {contactT("linkedin.content")}
            </a>
        </>
    );
}
