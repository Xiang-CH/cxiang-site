const numberFormatter = new Intl.NumberFormat();

/**
 * Formats a blog view count with a trailing plus sign.
 *
 * @param value - The blog view count to format
 * @returns The formatted view count followed by `+`
 */
export function formatBlogViewCount(value: number) {
    return `${numberFormatter.format(value)}+`;
}

/**
 * Formats a blog like count for display.
 *
 * @param value - The blog like count to format
 * @returns The formatted blog like count
 */
export function formatBlogLikeCount(value: number) {
    return numberFormatter.format(value);
}

/**
 * Creates a label describing the minimum number of blog views.
 *
 * @param value - The blog view count to format
 * @returns A label in the form `At least {formatted} views`
 */
export function getBlogViewCountLabel(value: number) {
    return `At least ${numberFormatter.format(value)} views`;
}
