import { createPreview, normalizeWhitespace } from '../../lib/text'
import { findIntentMatches } from '../../shared/intent-matcher'
import type { IntentLeadsPayload, LeadPayload, ScanContext } from '../../shared/types'
import { extractIntentPayloads } from '../intent-utils'

// Reads light-DOM slot content — slotted children are in the host element's light DOM
// and are accessible via querySelector even when the component uses shadow DOM.
function readSlottedText(el: Element): string {
    const parts: string[] = []
    for (const sel of ['[slot="title"]', '[slot="text-body"]', 'h1', 'h3', 'p']) {
        const child = el.querySelector(sel)
        if (child instanceof HTMLElement) {
            const t = normalizeWhitespace(child.innerText)
            if (t) parts.push(t)
        }
    }
    return parts.join(' ').trim()
}

function toAbsolute(path: string): string {
    try { return new URL(path, 'https://www.reddit.com').href } catch { return path }
}

function pageSubreddit(url: string): string | undefined {
    try {
        const m = new URL(url).pathname.match(/^\/r\/([A-Za-z0-9_]+)/i)
        return m ? `r/${m[1]}` : undefined
    } catch { return undefined }
}

type ShredditCandidate = {
    usernameOrName: string
    profileUrl: string
    sourceUrl: string
    matchedText: string
}

function collectShredditCandidates(): ShredditCandidate[] {
    const seen = new Set<string>()
    const results: ShredditCandidate[] = []

    const process = (el: Element, permalinkAttr: string) => {
        const author = el.getAttribute('author')
        const permalink =
            el.getAttribute(permalinkAttr) ??
            el.getAttribute('permalink') ??
            el.getAttribute('content-href')

        if (!author || !permalink) return

        const key = `${author}::${permalink}`
        if (seen.has(key)) return
        seen.add(key)

        // Title from attribute (posts only) + slotted body text (light DOM)
        const titleAttr = el.getAttribute('post-title') ?? el.getAttribute('aria-label') ?? ''
        const slotText = readSlottedText(el)
        const matchedText = [titleAttr, slotText].filter(Boolean).join(' ').trim()

        if (matchedText.length < 8) return

        results.push({
            usernameOrName: author,
            profileUrl: `https://www.reddit.com/user/${author}/`,
            sourceUrl: toAbsolute(permalink),
            matchedText,
        })
    }

    for (const el of document.querySelectorAll('shreddit-post')) {
        process(el, 'permalink')
    }
    for (const el of document.querySelectorAll('shreddit-comment')) {
        process(el, 'permalink')
    }

    return results
}

function extractShredditSignals(context: ScanContext): IntentLeadsPayload[] {
    const userId = context.config.farcastUserId?.trim()
    if (!userId) return []

    const candidates = collectShredditCandidates()
    const pageContext = pageSubreddit(context.url)

    console.info(`[Farcast][reddit] ${candidates.length} shreddit candidate(s) found`)
    if (candidates.length === 0) return []

    return context.config.activePlaybooks.flatMap((playbook) => {
        const keywords = [...new Set(playbook.intent_keywords.map((k) => k.trim()).filter(Boolean))]
        if (keywords.length === 0) {
            console.warn(`[Farcast] Playbook "${playbook.product_name}" has no intent keywords`)
            return []
        }

        console.info(`[Farcast] Matching ${keywords.length} keyword(s) for "${playbook.product_name}":`, keywords)

        const leadsByKey = new Map<string, LeadPayload>()

        for (const candidate of candidates) {
            const matches = findIntentMatches(candidate.matchedText, keywords)
            for (const match of matches) {
                const lead: LeadPayload = {
                    username_or_name: candidate.usernameOrName,
                    profile_url: candidate.profileUrl,
                    matched_text_preview: createPreview(candidate.matchedText, 280),
                    matched_keyword: match.keyword,
                    source_url: candidate.sourceUrl,
                    page_context: pageContext,
                    intent_level: match.intent_level,
                }
                leadsByKey.set(
                    [lead.profile_url, lead.source_url, lead.matched_keyword].join('::'),
                    lead
                )
            }
        }

        const leads = Array.from(leadsByKey.values())
        if (leads.length === 0) {
            console.info(`[Farcast] No keyword matches for "${playbook.product_name}" on this page`)
            return []
        }

        console.info(`[Farcast] ${leads.length} lead(s) matched for "${playbook.product_name}"`)
        return [{
            user_id: userId,
            playbook_id: playbook.playbook_id,
            platform: context.platform,
            icp_summary: playbook.icp_summary,
            recommended_subreddits: playbook.recommended_subreddits,
            leads,
        }]
    })
}

export async function extractRedditIntentSignals(
    context: ScanContext
): Promise<IntentLeadsPayload[]> {
    // New Reddit (shreddit) uses closed shadow DOM — extract from element attributes instead
    if (document.querySelector('shreddit-post, shreddit-comment')) {
        return extractShredditSignals(context)
    }

    // Old Reddit: classic DOM, generic extraction works fine
    return extractIntentPayloads(context, {
        containers: ['div[data-testid="post-container"]', '.thing', '.Comment'],
        text: ['[data-testid="post-content"]', '.md', 'p', 'h1', 'h2'],
        authorName: ['a[data-testid="post_author_link"]', '.author'],
        authorBio: [],
        authorLink: ['a[data-testid="post_author_link"]', '.author'],
        sourceLink: ['a[href*="/comments/"]'],
        timestamp: ['time'],
    })
}
