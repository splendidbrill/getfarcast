export function normalizeWhitespace(value: string) {
    return value.replace(/\s+/g, ' ').trim();
}

export function createPreview(value: string, maxLength = 100) {
    const normalized = normalizeWhitespace(value);
    return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength)}...`;
}
