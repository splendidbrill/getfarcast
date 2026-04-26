import { API_ENDPOINTS } from './constants';
import type {
    ContentPerformancePayload,
    EngagerLeadsPayload,
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
    const response = await fetch(`${options.apiBaseUrl.replace(/\/$/, '')}${path}`, {
        method: options.method ?? 'GET',
        headers: {
            Authorization: `Bearer ${options.authToken}`,
            'Content-Type': 'application/json'
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error(`Extension API request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
}

export async function fetchExtensionConfig(input: AuthorizedRequest): Promise<ExtensionConfig> {
    return authorizedFetch<ExtensionConfig>(API_ENDPOINTS.CONFIG, input);
}

export async function submitContentPerformance(
    input: AuthorizedRequest & { payload: ContentPerformancePayload }
) {
    return authorizedFetch<{ ok: boolean }>(API_ENDPOINTS.CONTENT_PERFORMANCE, {
        ...input,
        method: 'POST',
        body: input.payload
    });
}

export async function submitEngagerLeads(
    input: AuthorizedRequest & { payload: EngagerLeadsPayload }
) {
    return authorizedFetch<{ ok: boolean }>(API_ENDPOINTS.ENGAGER_LEADS, {
        ...input,
        method: 'POST',
        body: input.payload
    });
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
