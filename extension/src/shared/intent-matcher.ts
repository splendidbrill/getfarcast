import type { IntentMatch } from './types';

export function findIntentMatches(sourceText: string, keywords: string[]): IntentMatch[] {
    const normalizedText = sourceText.toLowerCase();

    return keywords
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .filter((keyword) => normalizedText.includes(keyword.toLowerCase()))
        .map((keyword) => ({
            keyword,
            matchedText: sourceText
        }));
}

// Future enhancement:
// The backend API handoff occurs after a client-side substring match is found.
// This is the integration point where a server-side LLM verifier can later score
// whether the detected text truly represents buyer intent.
