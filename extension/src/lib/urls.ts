import type { Platform } from '../shared/types';

export function detectPlatform(hostname: string): Platform | null {
    if (/(^|\.)x\.com$|(^|\.)twitter\.com$/.test(hostname)) {
        return 'twitter_x';
    }

    if (/(^|\.)reddit\.com$/.test(hostname)) {
        return 'reddit';
    }

    if (/(^|\.)linkedin\.com$/.test(hostname)) {
        return 'linkedin';
    }

    return null;
}
