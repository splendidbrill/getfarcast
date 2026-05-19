export const DEFAULT_API_BASE_URL = 'https://www.getfarcast.com';
export const CONFIG_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

export const STORAGE_KEYS = {
    FARCAST_USER_ID: 'farcast_user_id',
    FARCAST_AUTH_TOKEN: 'farcast_auth_token',
    CONNECTED_HANDLES: 'connected_handles',
    ACTIVE_PLAYBOOKS: 'active_playbooks',
    LAST_SYNC_AT: 'last_sync_at',
    CAPTURED_LEAD_IDS: 'captured_lead_ids',
    API_BASE_URL: 'api_base_url',
    CACHED_EXTENSION_CONFIG: 'cached_extension_config',
    LAST_REDDIT_SEARCH_AT: 'last_reddit_search_at',
} as const;

// Throttle: only trigger Reddit background search once per 30 minutes
export const REDDIT_SEARCH_THROTTLE_MS = 30 * 60 * 1000;
export const QUEUE_CHECK_THROTTLE_MS = 60 * 1000; // 1 minute

export const API_ENDPOINTS = {
    CONFIG: '/api/extension/config',
    CONTENT_PERFORMANCE: '/api/extension/content-performance',
    ENGAGER_LEADS: '/api/extension/engager-leads',
    INTENT_LEADS: '/api/extension/intent-leads',
    GENERATE_REPLY: '/api/extension/generate-reply',
    QUEUE: '/api/agent/queue',
} as const;

export const STORAGE_KEYS_EXTRA = {
    PENDING_POSTS: 'farcast_pending_posts',
    LAST_QUEUE_CHECK: 'farcast_last_queue_check',
} as const;
