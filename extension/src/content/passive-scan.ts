import { MessageType, sendRuntimeMessage } from '../shared/messaging'
import { getPlatformSelectors } from '../shared/selectors'
import type { ExtensionConfig, IntentLeadsPayload, Platform, ScanContext } from '../shared/types'

type RuntimeConfigResponse = {
    ok: boolean
    config?: ExtensionConfig | null
    reason?: string
    error?: string
}

type ScanResult = {
    intentSignals?: IntentLeadsPayload[] | null
}

type PassiveScanOptions = {
    platform: Platform
    label: string
    scan: (context: ScanContext) => Promise<ScanResult>
}

const DEFAULT_SCAN_DEBOUNCE_MS = 1200

export function startPassiveScan(options: PassiveScanOptions) {
    const submittedLeadKeys = new Set<string>()

    let currentUrl = window.location.href
    let lastReportedUrl = ''
    let scanTimeoutId: number | null = null
    let isRunning = false
    let rerunRequested = false

    const reportPageContext = async () => {
        if (window.location.href === lastReportedUrl) {
            return
        }

        lastReportedUrl = window.location.href

        await sendRuntimeMessage({
            type: MessageType.REPORT_PAGE_CONTEXT,
            payload: {
                platform: options.platform,
                url: window.location.href,
                title: document.title,
                observedAt: new Date().toISOString()
            }
        })
    }

    const getRuntimeContext = async (): Promise<ScanContext | null> => {
        const response = await sendRuntimeMessage<RuntimeConfigResponse>({
            type: MessageType.GET_RUNTIME_CONFIG
        })

        if (!response?.ok || !response.config) {
            return null
        }

        return {
            platform: options.platform,
            url: window.location.href,
            config: response.config,
            selectors: getPlatformSelectors(response.config.selectors, options.platform)
        }
    }

    const submitIntentSignals = async (payloads: IntentLeadsPayload[] | null | undefined) => {
        if (!payloads?.length) {
            return
        }

        for (const payload of payloads) {
            const nextLeads = payload.leads.filter((lead) => {
                const leadKey = [
                    payload.playbook_id,
                    payload.platform,
                    lead.profile_url,
                    lead.matched_keyword,
                    lead.source_url
                ]
                    .map((value) => value?.trim().toLowerCase() ?? '')
                    .join('::')

                if (!leadKey || submittedLeadKeys.has(leadKey)) {
                    return false
                }

                submittedLeadKeys.add(leadKey)
                return true
            })

            if (nextLeads.length === 0) {
                continue
            }

            await sendRuntimeMessage({
                type: MessageType.SUBMIT_INTENT_LEADS,
                payload: {
                    ...payload,
                    leads: nextLeads
                }
            })
        }
    }

    const runScan = async (reason: string) => {
        if (isRunning) {
            rerunRequested = true
            return
        }

        isRunning = true

        try {
            const context = await getRuntimeContext()

            if (!context) {
                return
            }

            await reportPageContext()

            const result = await options.scan(context)
            await submitIntentSignals(result.intentSignals)

            console.info(`[Farcast][${options.label}] Passive scan completed`, {
                reason,
                url: context.url
            })
        } catch (error) {
            console.warn(`[Farcast][${options.label}] Passive scan failed`, error)
        } finally {
            isRunning = false

            if (rerunRequested) {
                rerunRequested = false
                scheduleScan('rerun-requested', 250)
            }
        }
    }

    const scheduleScan = (reason: string, delayMs = DEFAULT_SCAN_DEBOUNCE_MS) => {
        if (scanTimeoutId !== null) {
            window.clearTimeout(scanTimeoutId)
        }

        scanTimeoutId = window.setTimeout(() => {
            scanTimeoutId = null
            void runScan(reason)
        }, delayMs)
    }

    const handleUrlChange = (reason: string) => {
        if (window.location.href === currentUrl) {
            return
        }

        currentUrl = window.location.href
        scheduleScan(reason, 300)
    }

    const originalPushState = history.pushState.bind(history)
    history.pushState = function pushState(...args) {
        originalPushState(...args)
        handleUrlChange('history-push-state')
    }

    const originalReplaceState = history.replaceState.bind(history)
    history.replaceState = function replaceState(...args) {
        originalReplaceState(...args)
        handleUrlChange('history-replace-state')
    }

    window.addEventListener('popstate', () => handleUrlChange('history-pop-state'))
    window.addEventListener('focus', () => scheduleScan('window-focus', 300))
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            scheduleScan('document-visible', 300)
        }
    })

    const observer = new MutationObserver(() => {
        scheduleScan('dom-mutation')
        handleUrlChange('dom-mutation-url-check')
    })

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    })

    scheduleScan('initial-load', 0)
}