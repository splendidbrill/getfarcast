import {
    fetchExtensionConfig,
    submitContentPerformance,
    submitEngagerLeads,
    submitIntentLeads
} from '../shared/api'
import { API_ENDPOINTS, DEFAULT_API_BASE_URL, REDDIT_SEARCH_THROTTLE_MS, STORAGE_KEYS } from '../shared/constants'
import { isConfigStale } from '../shared/config'
import {
    MessageType,
    type RuntimeMessage,
    type SyncNowResponse
} from '../shared/messaging'
import {
    getFromStorage,
    mergeCapturedLeadIds,
    removeFromStorage,
    setInStorage
} from '../shared/storage'
import { nowIso } from '../lib/time'
import type { ExtensionConfig } from '../shared/types'

let syncInFlight: Promise<
    | { ok: true; lastSyncAt: string }
    | { ok: false; reason: string }
> | null = null

async function syncRemoteConfig(force = false) {
    if (syncInFlight) {
        return syncInFlight
    }

    syncInFlight = (async () => {
        const authToken = await getFromStorage<string>(STORAGE_KEYS.FARCAST_AUTH_TOKEN)
        const apiBaseUrl =
            (await getFromStorage<string>(STORAGE_KEYS.API_BASE_URL)) ?? DEFAULT_API_BASE_URL
        const cachedConfig = await getFromStorage<ExtensionConfig>(
            STORAGE_KEYS.CACHED_EXTENSION_CONFIG
        )

        if (!authToken) {
            return { ok: false, reason: 'Missing auth token' } as const
        }

        if (!force && cachedConfig && !isConfigStale(cachedConfig)) {
            return { ok: true, lastSyncAt: cachedConfig.syncedAt } as const
        }

        let remoteConfig
        try {
            remoteConfig = await fetchExtensionConfig({ apiBaseUrl, authToken })
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg === 'UNAUTHORIZED') {
                // Token expired — clear it so the popup reverts to "Connect Account"
                await removeFromStorage(STORAGE_KEYS.FARCAST_AUTH_TOKEN)
                return { ok: false, reason: 'Token expired — reconnect via the extension popup' } as const
            }
            throw err
        }

        const lastSyncAt = nowIso()

        await setInStorage({
            [STORAGE_KEYS.CACHED_EXTENSION_CONFIG]: {
                ...remoteConfig,
                syncedAt: lastSyncAt
            },
            [STORAGE_KEYS.CONNECTED_HANDLES]: remoteConfig.connectedHandles,
            [STORAGE_KEYS.ACTIVE_PLAYBOOKS]: remoteConfig.activePlaybooks,
            [STORAGE_KEYS.LAST_SYNC_AT]: lastSyncAt
        })

        return { ok: true, lastSyncAt } as const
    })()

    try {
        return await syncInFlight
    } finally {
        syncInFlight = null
    }
}

async function getRuntimeConfig() {
    const cachedConfig = await getFromStorage<ExtensionConfig>(STORAGE_KEYS.CACHED_EXTENSION_CONFIG)

    if (cachedConfig && !isConfigStale(cachedConfig)) {
        return {
            ok: true,
            config: cachedConfig,
            lastSyncAt: cachedConfig.syncedAt
        } as const
    }

    const syncResult = await syncRemoteConfig(!cachedConfig)
    const refreshedConfig = await getFromStorage<ExtensionConfig>(STORAGE_KEYS.CACHED_EXTENSION_CONFIG)

    if (refreshedConfig) {
        return {
            ok: true,
            config: refreshedConfig,
            lastSyncAt: refreshedConfig.syncedAt,
            refreshed: syncResult.ok
        } as const
    }

    return {
        ok: false,
        config: null,
        reason: syncResult.ok ? 'Missing cached config after sync' : syncResult.reason
    } as const
}

chrome.runtime.onInstalled.addListener(() => {
    void setInStorage({
        [STORAGE_KEYS.API_BASE_URL]: DEFAULT_API_BASE_URL
    })

    chrome.alarms.create('weekly-config-sync', {
        periodInMinutes: 60 * 24 * 7
    })

    void syncRemoteConfig(true)
})

chrome.alarms.onAlarm.addListener((alarm: { name?: string }) => {
    if (alarm.name === 'weekly-config-sync') {
        void syncRemoteConfig(true)
    }
})

chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create('weekly-config-sync', {
        periodInMinutes: 60 * 24 * 7
    })

    void syncRemoteConfig(false)
})

chrome.runtime.onMessageExternal.addListener((message: { type: string; token?: string }, _sender: unknown, sendResponse: (response: unknown) => void) => {
    if (message.type === 'SET_AUTH_TOKEN' && message.token) {
        void setInStorage({ [STORAGE_KEYS.FARCAST_AUTH_TOKEN]: message.token })
            .then(() => syncRemoteConfig(true))
            .then((result) => sendResponse({ ok: result.ok }))
            .catch(() => sendResponse({ ok: false }))
        return true
    }
    sendResponse({ ok: false, error: 'Unknown message type' })
})

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender: unknown, sendResponse: (response: unknown) => void) => {
    void handleRuntimeMessage(message)
        .then(sendResponse)
        .catch((error) => {
            console.error('[Farcast][Background] Message handling failed', error)
            sendResponse({
                ok: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        })

    return true
})

async function handleRuntimeMessage(message: RuntimeMessage) {
    switch (message.type) {
        case MessageType.PING:
            return { ok: true, pong: true }

        case MessageType.GET_RUNTIME_CONFIG:
            return getRuntimeConfig()

        case MessageType.SYNC_NOW: {
            const result = await syncRemoteConfig(true)
            const response: SyncNowResponse = result
            return response
        }

        case MessageType.REPORT_PAGE_CONTEXT:
            console.info('[Farcast][Background] Passive page context report', message.payload)
            return { ok: true }

        case MessageType.SUBMIT_CONTENT_PERFORMANCE: {
            const authToken = await getFromStorage<string>(STORAGE_KEYS.FARCAST_AUTH_TOKEN)
            const apiBaseUrl =
                (await getFromStorage<string>(STORAGE_KEYS.API_BASE_URL)) ?? DEFAULT_API_BASE_URL

            if (!authToken) {
                return { ok: false, error: 'Missing auth token' }
            }

            await submitContentPerformance({ apiBaseUrl, authToken, payload: message.payload })
            return { ok: true }
        }

        case MessageType.SUBMIT_ENGAGER_LEADS: {
            const authToken = await getFromStorage<string>(STORAGE_KEYS.FARCAST_AUTH_TOKEN)
            const apiBaseUrl =
                (await getFromStorage<string>(STORAGE_KEYS.API_BASE_URL)) ?? DEFAULT_API_BASE_URL

            if (!authToken) {
                return { ok: false, error: 'Missing auth token' }
            }

            await submitEngagerLeads({ apiBaseUrl, authToken, payload: message.payload })
            await mergeCapturedLeadIds(
                message.payload.leads.map((lead: { profile_url: string }) => lead.profile_url)
            )
            return { ok: true }
        }

        case MessageType.SUBMIT_INTENT_LEADS: {
            const authToken = await getFromStorage<string>(STORAGE_KEYS.FARCAST_AUTH_TOKEN)
            const apiBaseUrl =
                (await getFromStorage<string>(STORAGE_KEYS.API_BASE_URL)) ?? DEFAULT_API_BASE_URL

            if (!authToken) {
                return { ok: false, error: 'Missing auth token' }
            }

            await submitIntentLeads({ apiBaseUrl, authToken, payload: message.payload })
            await mergeCapturedLeadIds(
                message.payload.leads.map((lead: { profile_url: string }) => lead.profile_url)
            )
            return { ok: true }
        }

        case MessageType.GENERATE_AI_REPLY: {
            const authToken = await getFromStorage<string>(STORAGE_KEYS.FARCAST_AUTH_TOKEN)
            const apiBaseUrl =
                (await getFromStorage<string>(STORAGE_KEYS.API_BASE_URL)) ?? DEFAULT_API_BASE_URL

            if (!authToken) return { ok: false, error: 'Missing auth token' }

            try {
                const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${API_ENDPOINTS.GENERATE_REPLY}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(message.payload),
                })

                if (res.status === 401) return { ok: false, error: 'Unauthorized — reconnect your account' }
                if (!res.ok) return { ok: false, error: `API error ${res.status}` }

                const data = await res.json() as { reply?: string }
                return { ok: true, reply: data.reply ?? '' }
            } catch (err) {
                console.warn('[Farcast][Background] generate-reply failed', err)
                return { ok: false, error: String(err) }
            }
        }

        case MessageType.TRIGGER_REDDIT_SEARCH: {
            const authToken = await getFromStorage<string>(STORAGE_KEYS.FARCAST_AUTH_TOKEN)
            const apiBaseUrl =
                (await getFromStorage<string>(STORAGE_KEYS.API_BASE_URL)) ?? DEFAULT_API_BASE_URL

            if (!authToken) return { ok: false, error: 'Missing auth token' }

            // Throttle: skip if searched recently
            const lastSearchAt = await getFromStorage<number>(STORAGE_KEYS.LAST_REDDIT_SEARCH_AT)
            if (lastSearchAt && Date.now() - lastSearchAt < REDDIT_SEARCH_THROTTLE_MS) {
                return { ok: true, skipped: true }
            }

            await setInStorage({ [STORAGE_KEYS.LAST_REDDIT_SEARCH_AT]: Date.now() })

            try {
                const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/background/reddit-search`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                })
                const result = await res.json()
                console.info('[Farcast][Background] Reddit search done', result)
                return { ok: true, ...result }
            } catch (err) {
                console.warn('[Farcast][Background] Reddit search failed', err)
                return { ok: false, error: String(err) }
            }
        }

        case MessageType.TRIGGER_XRAY_SEARCH: {
            const authToken = await getFromStorage<string>(STORAGE_KEYS.FARCAST_AUTH_TOKEN)
            const apiBaseUrl =
                (await getFromStorage<string>(STORAGE_KEYS.API_BASE_URL)) ?? DEFAULT_API_BASE_URL

            if (!authToken) return { ok: false, error: 'Missing auth token' }

            try {
                const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/background/xray-search`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(message.payload)
                })
                const result = await res.json()
                console.info('[Farcast][Background] X-Ray search done', result)
                return { ok: true, ...result }
            } catch (err) {
                console.warn('[Farcast][Background] X-Ray search failed', err)
                return { ok: false, error: String(err) }
            }
        }

        default:
            return { ok: false, error: 'Unknown message type' }
    }
}
