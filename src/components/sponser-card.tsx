import { BuymeacoffeeIconColorBg } from "@/components/icons/buymeacoffee-icon";
import { AifadianIconColorBg } from "@/components/icons/aifadian-icon";

export default function SponserCard() {
    return (
        /* <div className="w-full max-w-3xl px-6 pb-4">
                    <div className="mt-10 flex flex-wrap gap-3 rounded-lg border border-border p-6 text-sm text-muted-foreground items-center">
                        <p>If you liked this post, you can support me on:</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href="https://buymeacoffee.com/cxiang"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                <BuymeacoffeeIcon size={18} color="currentColor" strokeWidth={0} />
                                Buy me a coffee
                            </a>
                            or
                            <a
                                href="https://ifdian.net/a/cxiangsite"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-[#ece6f8b6] dark:bg-primary px-4 py-2 text-sm font-medium text-[#946CE6] dark:text-[#8c5deb] transition-colors hover:bg-[#ece6f8b6]/80 dark:hover:bg-primary/90"
                            >
                                <AifadianIcon size={18} color="currentColor" />
                                爱发电
                            </a>
                        </div>
                    </div>
                </div> */
        <div className="w-full max-w-180 pb-3 pt-5">
            <div className="mt-10 flex flex-wrap gap-3 rounded-lg border border-border px-6 py-4 text-sm text-muted-foreground items-center">
                <p>If you liked this post, you can support me by:</p>
                <div className="flex flex-wrap items-center gap-3">
                    <a
                        href="https://buymeacoffee.com/cxiang"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <BuymeacoffeeIconColorBg />
                    </a>
                    or
                    <a
                        href="https://ifdian.net/a/cxiangsite"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg"
                    >
                        <AifadianIconColorBg />
                    </a>
                </div>
            </div>
        </div>
    );
}
