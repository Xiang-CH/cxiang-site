const numberFormatter = new Intl.NumberFormat();

export function formatBlogViewCount(value: number) {
    return `${numberFormatter.format(value)}+`;
}

export function formatBlogLikeCount(value: number) {
    return numberFormatter.format(value);
}

export function getBlogViewCountLabel(value: number) {
    return `At least ${numberFormatter.format(value)} views`;
}
