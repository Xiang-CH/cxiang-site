import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Badge } from "@/components/ui/badge";
import { GitHubLogoIcon, LinkedInLogoIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default async function Intro() {
    const t = await getTranslations("intro");

    return (
        <div
            className="flex flex-col justify-center items-center h-screen px-4 md:px-6 pb-12 pt-4 transition-all snap-start content-section"
            id="intro"
        >
            <div className="flex flex-col justify-center items-center gap-4 border-0 rounded-2xl w-full max-w-4xl sm:p-20 p-2 transition-all mb-16">
                <section className="flex items-start justify-between w-full max-w-3xl">
                    <div className="flex flex-col items-start justify-center">
                        <h1 className="text-3xl font-bold transition-all fade-in">{t("name")}</h1>
                        <p className="text-lg fade-in ml-[1px]">{t("role")}</p>
                        <div className="flex flex-wrap mt-1 gap-2 opacity-0 animate-[fadeIn_1s_0.5s_ease_forwards]">
                            <Badge className="py-1 px-2">
                                <Link
                                    href="https://github.com/Xiang-CH"
                                    className="flex items-center"
                                >
                                    <GitHubLogoIcon className="mr-1" />
                                    Github
                                </Link>
                            </Badge>
                            <Badge className="py-1 px-2 bg-[#0A66C2] dark:bg-[#0A66C2]/95 dark:text-white">
                                <Link
                                    href="https://www.linkedin.com/in/xiang-chen-62389526a/"
                                    className="flex items-center"
                                >
                                    <LinkedInLogoIcon className="mr-1" />
                                    LinkedIn
                                </Link>
                            </Badge>
                            <Badge className="py-1 px-2 bg-gray-600 dark:bg-gray-700 text-white">
                                <Link
                                    href="mailto:cxiang@connect.hku.hk"
                                    className="flex items-center"
                                >
                                    <EnvelopeClosedIcon className="mr-1" />
                                    Email
                                </Link>
                            </Badge>
                        </div>
                        <p className="fade-in ml-[1px] mt-4">{t("about")}</p>
                    </div>
                    <Image
                        src="https://avatars.githubusercontent.com/u/63144890?v=4"
                        alt="Chen Xiang"
                        width={120}
                        height={120}
                        className="rounded-full hidden sm:block"
                    />
                </section>
                {/* <section className="flex items-center justify-between w-full max-w-3xl">
                    <p className="fade-in ml-[1px]">{t('about')}</p>
                </section> */}
                <section className="flex items-center justify-between w-full max-w-3xl gap-4 mt-1 opacity-0 animate-[fadeIn_1s_0.5s_ease_forwards] transition-all">
                    <LocaleSwitcher />
                </section>
            </div>
        </div>
    );
}
