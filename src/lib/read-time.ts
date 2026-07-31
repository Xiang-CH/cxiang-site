import { type ExtendedRecordMap } from "notion-types";

const WORDS_PER_MINUTE = 200;
const CJK_CHARACTERS_PER_MINUTE = 500;

type NotionTextBlock = {
    type?: string;
    properties?: {
        title?: unknown;
    };
};

function getBlockValue(
    box: ExtendedRecordMap["block"][string] | undefined
): NotionTextBlock | undefined {
    if (!box) return undefined;

    const candidate = box.value as {
        value?: NotionTextBlock;
        properties?: NotionTextBlock["properties"];
    };
    return candidate.value ?? (box.value as NotionTextBlock);
}

function getBlockText(block: NotionTextBlock): string {
    const title = block.properties?.title;
    if (!Array.isArray(title)) return "";

    return title
        .map((segment) =>
            Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""
        )
        .join(" ");
}

/**
 * Estimates the reading time of prose in minutes, accounting for both word- and character-based languages.
 */
export function estimateReadTimeMinutes(text: string): number {
    const cjkCharacterCount = (
        text.match(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7a3]/g) ?? []
    ).length;
    const nonCjkText = text.replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7a3]/g, " ");
    const wordCount = nonCjkText.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;

    return Math.max(
        1,
        Math.ceil(wordCount / WORDS_PER_MINUTE + cjkCharacterCount / CJK_CHARACTERS_PER_MINUTE)
    );
}

/**
 * Estimates a Notion page's reading time from its rendered text blocks, excluding code samples.
 */
export function getRecordMapReadTimeMinutes(recordMap: ExtendedRecordMap): number {
    const text = Object.values(recordMap.block ?? {})
        .map(getBlockValue)
        .filter((block): block is NotionTextBlock => block !== undefined && block.type !== "code")
        .map(getBlockText)
        .join(" ");

    return estimateReadTimeMinutes(text);
}
