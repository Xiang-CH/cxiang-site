"use client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { redirect } from "@/i18n/navigation";
import Image from "next/image";

export function LocaleSwitcher({
    currentLocale,
    locales,
}: {
    currentLocale: string;
    locales: Record<string, string>;
}) {
    return (
        <Select
            defaultValue={currentLocale}
            onValueChange={(value) => {
                redirect({ href: "/", locale: value });
            }}
        >
            <SelectTrigger className="hover:cursor-pointer" aria-label="Language switcher">
                <Image
                    src={`/translate.svg`}
                    alt={``}
                    width={15}
                    height={15}
                    className="inline-block mr-2 dark:invert"
                    priority
                    quality={40}
                />
                <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(locales).map(([localeCode, localeName]) => (
                    <SelectItem key={localeCode} value={localeCode} aria-label={localeName}>
                        {localeName}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
