import { extractIntentPayloads } from '../intent-utils'
import type { IntentLeadsPayload, ScanContext } from '../../shared/types'

export async function extractLinkedInIntentSignals(
    context: ScanContext
): Promise<IntentLeadsPayload[]> {
    return extractIntentPayloads(context, {
        containers: [
            'div.feed-shared-update-v2',
            'div.occludable-update',
            'article',
            'div[data-urn*="activity"]',
            'div.comments-comment-item'
        ],
        text: [
            'span.break-words',
            'div.update-components-text',
            'div.feed-shared-inline-show-more-text',
            'div.comments-comment-item__main-content'
        ],
        authorName: [
            'span.update-components-actor__name',
            'span.comments-post-meta__name-text',
            'a[href*="/in/"] span',
            'a[href*="/company/"] span'
        ],
        authorBio: ['span.update-components-actor__description', 'span.comments-post-meta__headline'],
        authorLink: ['a[href*="/in/"]', 'a[href*="/company/"]', 'a[href*="/school/"]'],
        sourceLink: ['a[href*="/feed/update/"]', 'a[href*="/posts/"]'],
        timestamp: ['a[href*="/feed/update/"] time', 'time']
    })
}
