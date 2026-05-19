import { injectText } from './inject-reply'

type Platform = 'twitter' | 'linkedin'

interface QueuedPost {
    id: string
    content: string
    platform: Platform
    scheduled_for: string
    status: string
}

// ── Platform compose selectors ────────────────────────────────────────────────

const COMPOSE_TRIGGER: Record<Platform, string[]> = {
    twitter: [
        '[data-testid="SideNav_NewTweet_Button"]',
        '[aria-label="Post"][role="button"]',
        '[data-testid="tweetButtonInline"]',
    ],
    linkedin: [
        'button[aria-label="Start a post"]',
        '.share-box-feed-entry__trigger',
        '.share-creation-state__trigger-btn',
        'button.share-box-feed-entry__trigger',
    ],
}

const COMPOSE_INPUT: Record<Platform, string[]> = {
    twitter: [
        '[data-testid="tweetTextarea_0"][contenteditable="true"]',
        '[data-testid="tweetTextarea_0"]',
    ],
    linkedin: [
        '.ql-editor[contenteditable="true"]',
        '[data-placeholder][contenteditable="true"]',
        '.share-creation-state__editor [contenteditable="true"]',
    ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentPlatform(): Platform | null {
    const h = location.hostname
    if (h === 'x.com' || h.endsWith('.x.com') || h === 'twitter.com') return 'twitter'
    if (h === 'www.linkedin.com' || h === 'linkedin.com') return 'linkedin'
    return null
}

function findInput(platform: Platform): HTMLElement | null {
    for (const sel of COMPOSE_INPUT[platform]) {
        const el = document.querySelector<HTMLElement>(sel)
        if (el) return el
    }
    return null
}

function waitForInput(platform: Platform, timeoutMs = 8000): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
        const found = findInput(platform)
        if (found) return resolve(found)

        const deadline = Date.now() + timeoutMs
        const obs = new MutationObserver(() => {
            const el = findInput(platform)
            if (el) { obs.disconnect(); resolve(el); return }
            if (Date.now() > deadline) { obs.disconnect(); resolve(null) }
        })
        obs.observe(document.body, { childList: true, subtree: true })
    })
}

async function openCompose(platform: Platform): Promise<boolean> {
    // Already open?
    if (findInput(platform)) return true

    for (const sel of COMPOSE_TRIGGER[platform]) {
        const btn = document.querySelector<HTMLElement>(sel)
        if (btn) {
            btn.click()
            const input = await waitForInput(platform, 6000)
            return !!input
        }
    }
    return false
}

// ── Main deploy function (called from popup via tab message) ──────────────────

export async function deployQueuedPost(post: QueuedPost): Promise<{ ok: boolean; error?: string }> {
    const platform = currentPlatform()
    if (!platform || platform !== post.platform) {
        return { ok: false, error: 'Wrong platform tab' }
    }

    const opened = await openCompose(platform)
    if (!opened) {
        return { ok: false, error: 'Could not open compose box' }
    }

    // Small delay for LinkedIn's modal animation
    await new Promise((r) => setTimeout(r, 600))

    const input = findInput(platform)
    if (!input) {
        return { ok: false, error: 'Compose input not found after opening' }
    }

    injectText(input, post.content)
    return { ok: true }
}

// ── Message listener (receives DEPLOY_QUEUED_POST from popup) ─────────────────

export function initQueuePoster() {
    chrome.runtime.onMessage.addListener(
        (
            message: { type: string; payload?: QueuedPost },
            _sender: unknown,
            sendResponse: (r: unknown) => void
        ) => {
            if (message.type !== 'DEPLOY_QUEUED_POST' || !message.payload) return false

            void deployQueuedPost(message.payload).then(sendResponse)
            return true // keep channel open for async response
        }
    )
}
