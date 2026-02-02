export function stripMinecraftFormatting(text: string): string {
    if (!text) return text;
    return text
        // Strip section sign formatting codes (e.g., §a, §l)
        .replace(/\u00a7./g, "")
        // Strip ampersand formatting codes (e.g., &a, &l)
        .replace(/&[0-9A-FK-ORa-fk-or]/g, "")
        // Strip hex ampersand formatting codes (e.g., &x&F&F&0&0&0&0)
        .replace(/&x(?:&[0-9A-Fa-f]){6}/g, "")
        // Strip hex shorthand formatting (e.g., &#ff00ff)
        .replace(/&#[0-9A-Fa-f]{6}/g, "")
        // Normalize malformed UTF-8 sequences like "Â»"
        .replace(/\u00c2\u00bb/g, "\u00bb")
        .replace(/\u00c2/g, "");
}
