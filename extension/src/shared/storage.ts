import { STORAGE_KEYS } from './constants';

export async function getFromStorage<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T | undefined) ?? null;
}

export async function setInStorage(payload: Record<string, unknown>) {
    await chrome.storage.local.set(payload);
}

export async function removeFromStorage(key: string) {
    await chrome.storage.local.remove(key);
}

export async function mergeCapturedLeadIds(nextLeadIds: string[]) {
    const currentLeadIds =
        (await getFromStorage<string[]>(STORAGE_KEYS.CAPTURED_LEAD_IDS)) ?? [];

    const merged = Array.from(new Set([...currentLeadIds, ...nextLeadIds]));

    await setInStorage({
        [STORAGE_KEYS.CAPTURED_LEAD_IDS]: merged
    });

    return merged;
}
