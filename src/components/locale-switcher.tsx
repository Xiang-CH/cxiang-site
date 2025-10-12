"use client";
import { locales } from "@/i18n/routing";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { redirect } from "@/i18n/navigation";
import Image from "next/image";
import { useLocale } from "next-intl";

export function LocaleSwitcher() {
    const locale = useLocale();

    return (
        <Select
            defaultValue={locale}
            onValueChange={(value) => {
                redirect({ href: "/", locale: value });
            }}
        >
            <SelectTrigger className="hover:cursor-pointer">
                <Image
                    src={`/translate.svg`}
                    alt={``}
                    width={15}
                    height={15}
                    className="inline-block mr-2 dark:invert"
                />
                <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(locales).map(([localeCode, localeName]) => (
                    <SelectItem key={localeCode} value={localeCode}>
                        {localeName}
                    </SelectItem>
                ))}
                {/* <SelectItem key="zh-CN" value="zh-CN" disabled>
                    简体中文 (翻译中...)
                </SelectItem> */}
            </SelectContent>
        </Select>
    );
}
