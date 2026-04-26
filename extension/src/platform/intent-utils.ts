import { createPreview, normalizeWhitespace } from '../lib/text'
import { findIntentMatches, isNegativeBio } from '../shared/intent-matcher'
import type {
    IntentLeadsPayload,
    LeadPayload,
    Platform,
    PlatformSelectorConfig,
    ScanContext
} from '../shared/types'

function extractPageContext(platform: Platform, url: string): string | undefined {
    try {
        const parsed = new URL(url)
        if (platform === 'reddit') {
            const match = parsed.pathname.match(/^\/r\/([A-Za-z0-9_]+)/i)
            return match ? `r/${match[1]}` : undefined
        }
        if (platform === 'twitter_x') {
            const q = parsed.searchParams.get('q')
            return q ? `search:${q.slice(0, 60)}` : undefined
        }
    } catch {
        // ignore
    }
    return undefined
}

type SelectorGroupName = keyof PlatformSelectorConfig

type IntentSelectorFallbacks = {
    containers: string[]
    text: string[]
    authorName: string[]
    authorBio: string[]
    authorLink: string[]
    sourceLink: string[]
    timestamp: string[]
}

type CandidateLead = {
    usernameOrName: string
    bioOrHeadline?: string
    profileUrl: string
    sourceUrl: string
    postedAt?: string
    matchedText: string
    engagementWeight?: number
}

export function extractIntentPayloads(
    context: ScanContext,
    fallbacks: IntentSelectorFallbacks
): IntentLeadsPayload[] {
    const userId = context.config.farcastUserId?.trim()

    if (!userId) {
        return []
    }

    const candidates = collectCandidates(context, fallbacks)

    console.info(`[Farcast][${context.platform}] ${candidates.length} candidate(s) found on page`)

    if (candidates.length === 0) {
        return []
    }

    const pageContext = extractPageContext(context.platform, context.url)

    return context.config.activePlaybooks.flatMap((playbook) => {
        const keywords = uniqueStrings(playbook.intent_keywords.map((keyword) => keyword.trim()))

        if (keywords.length === 0) {
            console.warn(`[Farcast] Playbook "${playbook.product_name}" has no intent keywords — leads won't be captured for it.`)
            return []
        }

        console.info(`[Farcast] Matching ${keywords.length} keyword(s) for "${playbook.product_name}":`, keywords)

        const leadsByKey = new Map<string, LeadPayload>()

        for (const candidate of candidates) {
            // Drop job seekers, students, agencies — non-buyer bios
            if (candidate.bioOrHeadline && isNegativeBio(candidate.bioOrHeadline)) {
                continue
            }

            const matches = findIntentMatches(candidate.matchedText, keywords)

            for (const match of matches) {
                const lead: LeadPayload = {
                    username_or_name: candidate.usernameOrName,
                    bio_or_headline: candidate.bioOrHeadline,
                    profile_url: candidate.profileUrl,
                    matched_text_preview: createPreview(candidate.matchedText, 280),
                    matched_keyword: match.keyword,
                    source_url: candidate.sourceUrl,
                    posted_at: candidate.postedAt,
                    page_context: pageContext,
                    intent_level: match.intent_level,
                    engagement_weight: candidate.engagementWeight,
                }

                if (!isValidLead(lead)) {
                    continue
                }

                leadsByKey.set(makeLeadKey(lead), lead)
            }
        }

        const leads = Array.from(leadsByKey.values())

        if (leads.length === 0) {
            console.info(`[Farcast] No keyword matches for "${playbook.product_name}" on this page`)
            return []
        }

        console.info(`[Farcast] ${leads.length} lead(s) matched for "${playbook.product_name}"`, leads.map(l => ({ keyword: l.matched_keyword, name: l.username_or_name })))

        return [
            {
                user_id: userId,
                playbook_id: playbook.playbook_id,
                platform: context.platform,
                icp_summary: playbook.icp_summary,
                recommended_subreddits: playbook.recommended_subreddits,
                leads,
            }
        ]
    })
}

function collectCandidates(context: ScanContext, fallbacks: IntentSelectorFallbacks): CandidateLead[] {
    const containerSelectors = getSelectorCandidates(
        context.selectors,
        ['intent', 'page'],
        ['container', 'containers', 'card', 'cards', 'item', 'items', 'post', 'postCard', 'postContainer', 'comment'],
        fallbacks.containers
    )

    const textSelectors = getSelectorCandidates(
        context.selectors,
        ['intent', 'page'],
        ['text', 'body', 'content', 'description', 'message'],
        fallbacks.text
    )

    const authorNameSelectors = getSelectorCandidates(
        context.selectors,
        ['intent', 'page'],
        ['authorName', 'author', 'username', 'name', 'displayName'],
        fallbacks.authorName
    )

    const authorBioSelectors = getSelectorCandidates(
        context.selectors,
        ['intent', 'page'],
        ['authorBio', 'bio', 'headline', 'subtitle', 'description'],
        fallbacks.authorBio
    )

    const authorLinkSelectors = getSelectorCandidates(
        context.selectors,
        ['intent', 'page'],
        ['authorLink', 'profileLink', 'profileUrl', 'userLink'],
        fallbacks.authorLink
    )

    const sourceLinkSelectors = getSelectorCandidates(
        context.selectors,
        ['intent', 'page'],
        ['sourceLink', 'permalink', 'postLink', 'url'],
        fallbacks.sourceLink
    )

    const timestampSelectors = getSelectorCandidates(
        context.selectors,
        ['intent', 'page'],
        ['timestamp', 'time', 'postedAt', 'date'],
        fallbacks.timestamp
    )

    const containers = collectContainers(containerSelectors)
    console.info(`[Farcast][${context.platform}] ${containers.length} container(s) matched selectors on page`)

    const candidatesByKey = new Map<string, CandidateLead>()
    let droppedNoProfile = 0

    for (const container of containers) {
        const matchedText = readPrimaryText(container, textSelectors)

        if (!matchedText || matchedText.length < 8) {
            continue
        }

        const sourceUrl =
            readHref(container, sourceLinkSelectors) ??
            deriveSourceUrlFromContainer(container, context.platform) ??
            window.location.href

        const profileUrl =
            readHref(container, authorLinkSelectors) ?? deriveProfileUrl(container, context.platform, sourceUrl)

        const usernameOrName =
            readPrimaryText(container, authorNameSelectors) ??
            deriveNameFromUrl(profileUrl) ??
            deriveNameFromUrl(sourceUrl)

        if (!profileUrl || !usernameOrName) {
            droppedNoProfile++
            continue
        }

        const lead: CandidateLead = {
            usernameOrName,
            bioOrHeadline: readPrimaryText(container, authorBioSelectors) ?? undefined,
            profileUrl,
            sourceUrl,
            postedAt: readTimestamp(container, timestampSelectors) ?? undefined,
            matchedText,
            engagementWeight: extractEngagementWeight(container),
        }

        candidatesByKey.set(makeCandidateKey(lead), lead)
    }

    if (droppedNoProfile > 0) {
        console.info(`[Farcast][${context.platform}] ${droppedNoProfile} container(s) dropped — no author profile URL found (possible shadow DOM issue)`)
    }

    return Array.from(candidatesByKey.values())
}

function extractEngagementWeight(container: Element): number {
    const text = container instanceof HTMLElement ? container.innerText : (container.textContent ?? '')
    const match = text.match(/(\d+)\s*(?:replies?|comments?|responses?)/i)
    if (match) {
        const count = parseInt(match[1], 10)
        return isNaN(count) ? 0 : count
    }
    return 0
}

function collectContainers(selectors: string[]) {
    const seen = new Set<Element>()
    const containers: Element[] = []

    for (const selector of selectors) {
        for (const element of safeQueryAll(document, selector)) {
            if (seen.has(element)) {
                continue
            }

            seen.add(element)
            containers.push(element)
        }
    }

    if (containers.length === 0 && document.body) {
        containers.push(document.body)
    }

    return containers
}

function getSelectorCandidates(
    config: PlatformSelectorConfig | undefined,
    groups: SelectorGroupName[],
    keys: string[],
    fallbacks: string[]
) {
    const configured: string[] = []

    for (const groupName of groups) {
        const group = config?.[groupName]

        if (!group) {
            continue
        }

        for (const key of keys) {
            const selector = group[key]?.trim()

            if (selector) {
                configured.push(selector)
            }
        }
    }

    return uniqueStrings([...configured, ...fallbacks])
}

function readPrimaryText(root: ParentNode, selectors: string[]) {
    for (const selector of selectors) {
        for (const element of safeQueryAll(root, selector)) {
            const text = readText(element)

            if (text) {
                return text
            }
        }
    }

    if (root instanceof Element || root instanceof Document) {
        const fallback = normalizeWhitespace(
            root instanceof HTMLElement ? root.innerText : root.textContent ?? ''
        )

        return fallback || null
    }

    return null
}

function readHref(root: ParentNode, selectors: string[]) {
    for (const selector of selectors) {
        for (const element of safeQueryAll(root, selector)) {
            const href = readElementHref(element)

            if (href) {
                return href
            }
        }
    }

    return null
}

function readTimestamp(root: ParentNode, selectors: string[]) {
    for (const selector of selectors) {
        for (const element of safeQueryAll(root, selector)) {
            const timestamp =
                element.getAttribute('datetime') ??
                element.getAttribute('title') ??
                element.getAttribute('aria-label') ??
                readText(element)

            if (timestamp) {
                return timestamp.trim()
            }
        }
    }

    const timeElement = safeQueryAll(
        root instanceof Element ? root : document,
        'time'
    )[0] ?? null
    const fallback =
        timeElement?.getAttribute('datetime') ??
        timeElement?.getAttribute('title') ??
        timeElement?.textContent?.trim() ??
        null

    return fallback
}

function deriveSourceUrlFromContainer(container: Element, platform: Platform) {
    const hrefs = safeQueryAll(container, 'a[href]')
        .map((element) => readElementHref(element))
        .filter((href): href is string => Boolean(href))

    switch (platform) {
        case 'twitter_x':
            return hrefs.find((href) => /\/(status)\//.test(href)) ?? null
        case 'reddit':
            return hrefs.find((href) => /\/comments\//.test(href)) ?? null
        case 'linkedin':
            return (
                hrefs.find((href) => /\/feed\/update\//.test(href)) ??
                hrefs.find((href) => /\/posts\//.test(href)) ??
                null
            )
    }
}

function deriveProfileUrl(container: Element, platform: Platform, sourceUrl: string) {
    const hrefs = safeQueryAll(container, 'a[href]')
        .map((element) => readElementHref(element))
        .filter((href): href is string => Boolean(href))

    const profileHref = (() => {
        switch (platform) {
            case 'twitter_x':
                return hrefs.find((href) => /^https?:\/\/(?:x|twitter)\.com\/[^/?#]+\/?$/i.test(href))
            case 'reddit':
                return hrefs.find((href) => /\/u(?:ser)?\/[A-Za-z0-9_-]+\/?$/i.test(href))
            case 'linkedin':
                return hrefs.find((href) => /\/((in|company|school)\/)[:A-Za-z0-9%_.-]+/i.test(href))
        }
    })()

    if (profileHref) {
        return profileHref
    }

    if (platform === 'twitter_x') {
        const match = sourceUrl.match(/^https?:\/\/(?:x|twitter)\.com\/([^/?#]+)\/status\/\d+/i)

        if (match) {
            return `https://x.com/${match[1]}`
        }
    }

    return null
}

function deriveNameFromUrl(url: string | null) {
    if (!url) {
        return null
    }

    try {
        const parsed = new URL(url)
        const parts = parsed.pathname.split('/').filter(Boolean)

        if (parts.length === 0) {
            return null
        }

        if (parsed.hostname.includes('reddit.com')) {
            const userIndex = parts.findIndex((part) => part === 'user' || part === 'u')

            if (userIndex >= 0 && parts[userIndex + 1]) {
                return parts[userIndex + 1]
            }
        }

        if (parsed.hostname.includes('linkedin.com')) {
            const entityIndex = parts.findIndex((part) => ['in', 'company', 'school'].includes(part))

            if (entityIndex >= 0 && parts[entityIndex + 1]) {
                return parts[entityIndex + 1].replace(/-/g, ' ')
            }
        }

        if (parsed.hostname.includes('x.com') || parsed.hostname.includes('twitter.com')) {
            return parts[0]
        }

        return parts.at(-1) ?? null
    } catch {
        return null
    }
}

function readElementHref(element: Element) {
    if (!(element instanceof HTMLElement)) {
        return null
    }

    const directHref =
        element instanceof HTMLAnchorElement
            ? element.href
            : element.getAttribute('href') ?? element.closest('a[href]')?.getAttribute('href')

    if (!directHref) {
        return null
    }

    return toAbsoluteUrl(directHref)
}

function readText(element: Element) {
    return normalizeWhitespace(
        element instanceof HTMLElement ? element.innerText : element.textContent ?? ''
    )
}

function safeQueryAll(root: ParentNode, selector: string): Element[] {
    const results: Element[] = []
    try {
        results.push(...Array.from(root.querySelectorAll(selector)))
    } catch {
        return results
    }
    // Pierce one level of shadow DOM (e.g. Reddit's shreddit-post web components)
    if (root instanceof Element && root.shadowRoot) {
        try {
            results.push(...Array.from(root.shadowRoot.querySelectorAll(selector)))
        } catch {
            // ignore
        }
    }
    return results
}

function toAbsoluteUrl(href: string) {
    try {
        return new URL(href, window.location.origin).toString()
    } catch {
        return null
    }
}

function isValidLead(lead: LeadPayload) {
    return Boolean(
        lead.username_or_name?.trim() &&
            lead.profile_url?.trim() &&
            lead.matched_keyword?.trim() &&
            lead.source_url?.trim()
    )
}

function makeCandidateKey(candidate: CandidateLead) {
    return [candidate.profileUrl, candidate.sourceUrl, candidate.matchedText]
        .map((value) => value.trim().toLowerCase())
        .join('::')
}

function makeLeadKey(lead: LeadPayload) {
    return [lead.profile_url, lead.source_url, lead.matched_keyword]
        .map((value) => value?.trim().toLowerCase() ?? '')
        .join('::')
}

function uniqueStrings(values: string[]) {
    return Array.from(new Set(values.filter(Boolean)))
}