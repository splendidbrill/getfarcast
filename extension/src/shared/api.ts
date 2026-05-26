import { API_ENDPOINTS } from './constants';
import type {
    ExtensionConfig,
    IntentLeadsPayload
} from './types';

type AuthorizedRequest = {
    apiBaseUrl: string;
    authToken: string;
};

async function authorizedFetch<T>(
    path: string,
    options: AuthorizedRequest & { method?: string; body?: unknown }
): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    try {
        const response = await fetch(`${options.apiBaseUrl.replace(/\/$/, '')}${path}`, {
            method: options.method ?? 'GET',
            headers: {
                Authorization: `Bearer ${options.authToken}`,
                'Content-Type': 'application/json'
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: controller.signal
        });

        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }

        if (!response.ok) {
            throw new Error(`Extension API request failed with status ${response.status}`);
        }

        return (await response.json()) as T;
    } finally {
        clearTimeout(timer);
    }
}

export async function fetchExtensionConfig(input: AuthorizedRequest): Promise<ExtensionConfig> {
    return authorizedFetch<ExtensionConfig>(API_ENDPOINTS.CONFIG, input);
}

export async function submitIntentLeads(
    input: AuthorizedRequest & { payload: IntentLeadsPayload }
) {
    return authorizedFetch<{ ok: boolean }>(API_ENDPOINTS.INTENT_LEADS, {
        ...input,
        method: 'POST',
        body: input.payload
    });
}
