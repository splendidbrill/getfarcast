import { CONFIG_CACHE_TTL_MS, STORAGE_KEYS } from './constants';
import type { ExtensionConfig } from './types';

export function isConfigStale(config: ExtensionConfig) {
    return Date.now() - new Date(config.syncedAt).getTime() > CONFIG_CACHE_TTL_MS;
}

export async function getCachedConfig() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHED_EXTENSION_CONFIG);
    return (result[STORAGE_KEYS.CACHED_EXTENSION_CONFIG] as ExtensionConfig | undefined) ?? null;
}

export async function getCachedOrThrow() {
    const config = await getCachedConfig();

    if (!config) {
        throw new Error('Extension config has not been synced yet.');
    }

    return config;
}
