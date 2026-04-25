import type { IntentMatch } from './types'

// Mirrors server-side NEGATIVE_BIO_PATTERNS — drop non-buyer bios before submission
const NEGATIVE_BIO_PATTERNS: RegExp[] = [
    /\b(?:hiring|we'?re hiring|now hiring|join our team)\b/i,
    /\b(?:open to (?:work|opportunities)|seeking (?:new )?(?:role|position|opportunity)|job seeker)\b/i,
    /\b(?:looking for (?:a )?(?:job|role|position|internship))\b/i,
    /\b(?:cs|software|computer science|engineering)\s+student\b/i,
    /\b(?:undergrad|undergraduate|grad student|phd(?:\s+student)?|msc student|masters student)\b/i,
    /\b(?:learning to (?:code|program)|new to coding|just started coding|aspiring developer)\b/i,
    /\b(?:i teach|online course|course creator|e-?learning|instructor|professor|lecturer)\b/i,
    /\b(?:(?:digital )?marketing agency|growth agency|seo agency|we help (?:businesses|companies|startups|brands)|services agency)\b/i,
    /\b(?:available for (?:hire|freelance)|freelance (?:available|services)|hire me)\b/i,
]

export function isNegativeBio(bio: string): boolean {
    return NEGATIVE_BIO_PATTERNS.some((p) => p.test(bio))
}

const HIGH_INTENT_PATTERNS: RegExp[] = [
    /\blooking for\b/i,
    /\bany (?:good\s+)?(?:tool|software|app|platform|solution|recommendation)s?\b/i,
    /\brecommend(?:ation)?s?\b/i,
    /\bbest (?:tool|way|option|alternative|solution)\b/i,
    /\balternative to\b/i,
    /\breplace\b/i,
    /\bswitch(?:ing)? (?:from|away)\b/i,
    /\bwhat (?:do|should|would) (?:you|we|i) use\b/i,
    /\bany suggestions?\b/i,
    /\bhelp me find\b/i,
    /\bwhere (?:can|do) (?:i|we)\b/i,
    /\bhow (?:do|can|should) (?:i|we)\b/i,
    /\bis there (?:a|any)\b/i,
    /\bdoes anyone (?:know|use|recommend)\b/i,
]

const MEDIUM_INTENT_PATTERNS: RegExp[] = [
    /\bstruggl(?:e|ing|ed)\b/i,
    /\bmanual(?:ly)?\b/i,
    /\btoo (?:slow|expensive|hard|complex|complicated)\b/i,
    /\btime[- ]consuming\b/i,
    /\bfrustrat(?:e|ed|ing)\b/i,
    /\bpainful\b/i,
    /\bbroken\b/i,
    /\bissue with\b/i,
    /\bproblem with\b/i,
    /\bcan'?t figure\b/i,
    /\boverwhel(?:m|med|ming)\b/i,
    /\bnightmare\b/i,
    /\bwaste (?:of )?time\b/i,
    /\btired of\b/i,
    /\bsick of\b/i,
]

export function classifyIntentLevel(text: string): 'high' | 'medium' | 'low' {
    if (HIGH_INTENT_PATTERNS.some((p) => p.test(text))) return 'high'
    if (MEDIUM_INTENT_PATTERNS.some((p) => p.test(text))) return 'medium'
    return 'low'
}

export function isSpamText(text: string): boolean {
    const trimmed = text.trim()
    if (trimmed.length < 30) return true
    if (/^https?:\/\/\S+$/.test(trimmed)) return true
    const words = trimmed.split(/\s+/)
    const urlWords = words.filter((w) => /^https?:\/\//i.test(w))
    return urlWords.length > 0 && urlWords.length / words.length > 0.5
}

export function findIntentMatches(sourceText: string, keywords: string[]): IntentMatch[] {
    if (isSpamText(sourceText)) return []

    const normalizedText = sourceText.toLowerCase()
    const intentLevel = classifyIntentLevel(sourceText)

    return keywords
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .filter((keyword) => normalizedText.includes(keyword.toLowerCase()))
        .map((keyword) => ({
            keyword,
            matchedText: sourceText,
            intent_level: intentLevel,
        }))
}
