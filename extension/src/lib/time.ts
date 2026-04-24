export function nowIso() {
    return new Date().toISOString();
}

export function isWithinLastDays(isoDate: string, days: number) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return new Date(isoDate).getTime() >= cutoff;
}
