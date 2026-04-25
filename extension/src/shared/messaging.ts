import type {
    ContentPerformancePayload,
    EngagerLeadsPayload,
    IntentLeadsPayload,
    PageContextPayload
} from './types';

export const MessageType = {
    PING: 'PING',
    GET_RUNTIME_CONFIG: 'GET_RUNTIME_CONFIG',
    SYNC_NOW: 'SYNC_NOW',
    REPORT_PAGE_CONTEXT: 'REPORT_PAGE_CONTEXT',
    SUBMIT_CONTENT_PERFORMANCE: 'SUBMIT_CONTENT_PERFORMANCE',
    SUBMIT_ENGAGER_LEADS: 'SUBMIT_ENGAGER_LEADS',
    SUBMIT_INTENT_LEADS: 'SUBMIT_INTENT_LEADS',
    TRIGGER_REDDIT_SEARCH: 'TRIGGER_REDDIT_SEARCH',
} as const;

export type RuntimeMessage =
    | { type: typeof MessageType.PING }
    | { type: typeof MessageType.GET_RUNTIME_CONFIG }
    | { type: typeof MessageType.SYNC_NOW }
    | { type: typeof MessageType.REPORT_PAGE_CONTEXT; payload: PageContextPayload }
    | { type: typeof MessageType.SUBMIT_CONTENT_PERFORMANCE; payload: ContentPerformancePayload }
    | { type: typeof MessageType.SUBMIT_ENGAGER_LEADS; payload: EngagerLeadsPayload }
    | { type: typeof MessageType.SUBMIT_INTENT_LEADS; payload: IntentLeadsPayload }
    | { type: typeof MessageType.TRIGGER_REDDIT_SEARCH };

export type SyncNowResponse = {
    ok: boolean;
    lastSyncAt?: string;
    reason?: string;
};

export function sendRuntimeMessage<TResponse>(message: RuntimeMessage): Promise<TResponse> {
    return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}
