import { extractIntentPayloads } from '../intent-utils'
import type { IntentLeadsPayload, ScanContext } from '../../shared/types'

export async function extractRedditIntentSignals(
    context: ScanContext
): Promise<IntentLeadsPayload[]> {
    return extractIntentPayloads(context, {
        containers: [
            'shreddit-post',
            'shreddit-comment',
            'article',
            'div[data-testid="post-container"]',
            'faceplate-comment-helper'
        ],
        text: ['[slot="text-body"]', '[data-testid="post-content"]', 'p', 'h1', 'h2'],
        authorName: ['[data-testid="post_author_link"]', 'a[href*="/user/"]', 'a[href*="/u/"]'],
        authorBio: [],
        authorLink: ['[data-testid="post_author_link"]', 'a[href*="/user/"]', 'a[href*="/u/"]'],
        sourceLink: ['a[href*="/comments/"]'],
        timestamp: ['faceplate-timeago', 'time']
    })
}
