import type { Platform, PlatformSelectorConfig } from './types';

export function getPlatformSelectors(
    selectors: Partial<Record<Platform, PlatformSelectorConfig>>,
    platform: Platform
) {
    return selectors[platform];
}

export function getSelector(
    config: PlatformSelectorConfig | undefined,
    group: keyof PlatformSelectorConfig,
    key: string
) {
    return config?.[group]?.[key] ?? null;
}
