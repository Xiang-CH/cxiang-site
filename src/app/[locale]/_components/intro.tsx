import Image from "next/image";
import { getTranslations, getLocale } from 'next-intl/server';
import { LocaleSwitcher } from "@/components/locale-switcher";
import { locales } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge"
import { GitHubLogoIcon, LinkedInLogoIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default async function Intro() {
    const t = await getTranslations('intro');
    const locale = await getLocale() as keyof typeof locales;

    console.log('Current locale:', locale);

    return (
        <div className="flex flex-col justify-center items-center gap-4 h-screen p-6 transition-all snap-start" id="intro">
            <section className="flex items-start justify-between w-full max-w-3xl">
                <div className="flex flex-col items-start justify-center">
                    <h1 className="text-3xl font-bold transition-all fade-in">
                        {t('name')}
                    </h1>
                    <p className="text-lg fade-in ml-[1px]">{t('role')}</p>
                    <div className="flex flex-wrap mt-1 gap-2 opacity-0 animate-[fadeIn_1s_0.5s_ease_forwards]">
                        <Badge className="py-1 px-2">
                            <Link href="https://github.com/Xiang-CH" className="flex items-center">
                                <GitHubLogoIcon className="mr-1" />
                                Github
                            </Link>
                        </Badge>
                        <Badge className="py-1 px-2 bg-[#0A66C2] dark:bg-[#0A66C2]/95 dark:text-white">
                            <Link href="https://www.linkedin.com/in/xiang-chen-62389526a/" className="flex items-center">
                                <LinkedInLogoIcon className="mr-1" />
                                LinkedIn
                            </Link>
                        </Badge>
                        <Badge className="py-1 px-2 bg-gray-600 dark:bg-gray-700 text-white">
                            <Link href="mailto:cxiang@connect.hku.hk" className="flex items-center">
                                <EnvelopeClosedIcon className="mr-1" />
                                Email
                            </Link>
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-col items-start justify-start ">
                    <Image src="https://avatars.githubusercontent.com/u/63144890?v=4" alt="Chen Xiang" width={100} height={100} className="rounded-full"/>
                </div>
            </section>
            <section className="flex items-center justify-between w-full max-w-3xl">
                <p className="fade-in ml-[1px]">{t('about')}</p>
            </section>
            <section className="flex items-center justify-between w-full max-w-3xl gap-4 mt-1 md:mb-20 opacity-0 animate-[fadeIn_1s_0.5s_ease_forwards] transition-all">
                <LocaleSwitcher locale={locale}/>
            </section>
        </div>
    )
}

