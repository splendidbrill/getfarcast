import type {
    IntentLeadsPayload,
    PageContextPayload
} from './types';

export const MessageType = {
    PING: 'PING',
    GET_RUNTIME_CONFIG: 'GET_RUNTIME_CONFIG',
    SYNC_NOW: 'SYNC_NOW',
    REPORT_PAGE_CONTEXT: 'REPORT_PAGE_CONTEXT',
    SUBMIT_INTENT_LEADS: 'SUBMIT_INTENT_LEADS',
    TRIGGER_REDDIT_SEARCH: 'TRIGGER_REDDIT_SEARCH',
    TRIGGER_XRAY_SEARCH: 'TRIGGER_XRAY_SEARCH',
    GENERATE_AI_REPLY: 'GENERATE_AI_REPLY',
} as const;

export type GenerateAiReplyPayload = {
    platform: string;
    postText: string;
    authorName?: string;
};

export type GenerateAiReplyResponse = {
    ok: true;
    reply: string;
} | {
    ok: false;
    error: string;
};

export type RuntimeMessage =
    | { type: typeof MessageType.PING }
    | { type: typeof MessageType.GET_RUNTIME_CONFIG }
    | { type: typeof MessageType.SYNC_NOW }
    | { type: typeof MessageType.REPORT_PAGE_CONTEXT; payload: PageContextPayload }
    | { type: typeof MessageType.SUBMIT_INTENT_LEADS; payload: IntentLeadsPayload }
    | { type: typeof MessageType.TRIGGER_REDDIT_SEARCH }
    | { type: typeof MessageType.TRIGGER_XRAY_SEARCH; payload: { icpQuery: string; platform: 'linkedin' | 'reddit'; playbookId?: string } }
    | { type: typeof MessageType.GENERATE_AI_REPLY; payload: GenerateAiReplyPayload };

export type SyncNowResponse = {
    ok: boolean;
    lastSyncAt?: string;
    reason?: string;
};

export function sendRuntimeMessage<TResponse>(message: RuntimeMessage): Promise<TResponse | null> {
    try {
        return (chrome.runtime.sendMessage(message) as Promise<TResponse>).catch((err) => {
            if (isContextInvalidated(err)) return null
            return Promise.reject(err)
        })
    } catch (err) {
        if (isContextInvalidated(err)) return Promise.resolve(null)
        return Promise.reject(err)
    }
}

function isContextInvalidated(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err)
    return msg.includes('Extension context invalidated') || msg.includes('context invalidated')
}
