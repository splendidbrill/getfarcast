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

const MIN_SCAN_DELAY_MS = 1500
const MAX_SCAN_DELAY_MS = 4500
const RERUN_DELAY_MS = 400
const URL_CHANGE_DELAY_MS = 500
const MAX_SCANS_PER_MINUTE = 20
const MAX_LEADS_PER_SESSION = 400
// Enter cooldown after this many scans within BURST_WINDOW_MS
const BURST_SCAN_THRESHOLD = 8
const BURST_WINDOW_MS = 90_000
const MIN_COOLDOWN_MS = 25_000
const MAX_COOLDOWN_MS = 40_000

function randomDelay(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min))
}

export function startPassiveScan(options: PassiveScanOptions) {
    const submittedLeadKeys = new Set<string>()

    let currentUrl = window.location.href
    let lastReportedUrl = ''
    let scanTimeoutId: number | null = null
    let isRunning = false
    let rerunRequested = false
    let coolingUntil = 0
    let sessionLeadCount = 0

    // Sliding window of scan start times for rate limiting and burst detection
    const scanTimestamps: number[] = []

    function isTabVisible(): boolean {
        return document.visibilityState === 'visible'
    }

    function isOverRateLimit(): boolean {
        const now = Date.now()
        const cutoff = now - 60_000
        while (scanTimestamps.length > 0 && scanTimestamps[0] < cutoff) {
            scanTimestamps.shift()
        }
        return scanTimestamps.length >= MAX_SCANS_PER_MINUTE
    }

    // Returns true if we're in (or just entered) a cooldown window
    function checkCooldown(): boolean {
        const now = Date.now()
        if (coolingUntil > now) return true
        const burstCutoff = now - BURST_WINDOW_MS
        const recentCount = scanTimestamps.filter((t) => t > burstCutoff).length
        if (recentCount >= BURST_SCAN_THRESHOLD) {
            coolingUntil = now + randomDelay(MIN_COOLDOWN_MS, MAX_COOLDOWN_MS)
            return true
        }
        return false
    }

    const reportPageContext = async () => {
        if (window.location.href === lastReportedUrl) return
        lastReportedUrl = window.location.href
        await sendRuntimeMessage({
            type: MessageType.REPORT_PAGE_CONTEXT,
            payload: {
                platform: options.platform,
                url: window.location.href,
                title: document.title,
                observedAt: new Date().toISOString(),
            },
        })
    }

    const getRuntimeContext = async (): Promise<ScanContext | null> => {
        const response = await sendRuntimeMessage<RuntimeConfigResponse>({
            type: MessageType.GET_RUNTIME_CONFIG,
        })

        if (!response?.ok || !response.config) return null

        return {
            platform: options.platform,
            url: window.location.href,
            config: response.config,
            selectors: getPlatformSelectors(response.config.selectors, options.platform),
        }
    }

    const submitIntentSignals = async (payloads: IntentLeadsPayload[] | null | undefined) => {
        if (!payloads?.length) return

        for (const payload of payloads) {
            if (sessionLeadCount >= MAX_LEADS_PER_SESSION) break

            const nextLeads = payload.leads.filter((lead) => {
                const leadKey = [
                    payload.playbook_id,
                    payload.platform,
                    lead.profile_url,
                    lead.matched_keyword,
                    lead.source_url,
                ]
                    .map((value) => value?.trim().toLowerCase() ?? '')
                    .join('::')

                if (!leadKey || submittedLeadKeys.has(leadKey)) return false
                submittedLeadKeys.add(leadKey)
                return true
            })

            if (nextLeads.length === 0) continue

            sessionLeadCount += nextLeads.length

            await sendRuntimeMessage({
                type: MessageType.SUBMIT_INTENT_LEADS,
                payload: { ...payload, leads: nextLeads },
            })
        }
    }

    const runScan = async (reason: string) => {
        if (!isTabVisible()) return
        if (isRunning) { rerunRequested = true; return }
        if (isOverRateLimit()) return
        if (checkCooldown()) return

        isRunning = true
        scanTimestamps.push(Date.now())

        try {
            const context = await getRuntimeContext()
            if (!context) return

            await reportPageContext()

            const result = await options.scan(context)
            await submitIntentSignals(result.intentSignals)

            console.info(`[Farcast][${options.label}] Scan done (${reason})`)
        } catch (error) {
            console.warn(`[Farcast][${options.label}] Scan failed`, error)
        } finally {
            isRunning = false
            if (rerunRequested) {
                rerunRequested = false
                scheduleScan('rerun-requested', RERUN_DELAY_MS)
            }
        }
    }

    const scheduleScan = (reason: string, delayMs?: number) => {
        if (scanTimeoutId !== null) {
            window.clearTimeout(scanTimeoutId)
        }
        const delay = delayMs ?? randomDelay(MIN_SCAN_DELAY_MS, MAX_SCAN_DELAY_MS)
        scanTimeoutId = window.setTimeout(() => {
            scanTimeoutId = null
            void runScan(reason)
        }, delay)
    }

    const handleUrlChange = (reason: string) => {
        if (window.location.href === currentUrl) return
        currentUrl = window.location.href
        scheduleScan(reason, URL_CHANGE_DELAY_MS)
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
    window.addEventListener('focus', () => scheduleScan('window-focus'))
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            scheduleScan('document-visible')
        }
    })

    // childList + subtree only — characterData removed (too noisy, fires on timers/counters)
    const observer = new MutationObserver(() => {
        scheduleScan('dom-mutation')
        handleUrlChange('dom-mutation-url-check')
    })

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    })

    // Initial scan with a short random delay to let the page settle
    scheduleScan('initial-load', randomDelay(800, 1500))
}
