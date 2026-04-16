export const DEFAULT_API_BASE_URL = 'http://localhost:3000';
export const CONFIG_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

export const STORAGE_KEYS = {
    FARCAST_USER_ID: 'farcast_user_id',
    FARCAST_AUTH_TOKEN: 'farcast_auth_token',
    CONNECTED_HANDLES: 'connected_handles',
    ACTIVE_PLAYBOOKS: 'active_playbooks',
    LAST_SYNC_AT: 'last_sync_at',
    CAPTURED_LEAD_IDS: 'captured_lead_ids',
    API_BASE_URL: 'api_base_url',
    CACHED_EXTENSION_CONFIG: 'cached_extension_config'
} as const;

export const API_ENDPOINTS = {
    CONFIG: '/api/extension/config',
    CONTENT_PERFORMANCE: '/api/extension/content-performance',
    ENGAGER_LEADS: '/api/extension/engager-leads',
    INTENT_LEADS: '/api/extension/intent-leads'
} as const;
