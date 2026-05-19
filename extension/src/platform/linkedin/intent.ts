import { extractIntentPayloads } from '../intent-utils'
import type { IntentLeadsPayload, ScanContext } from '../../shared/types'

export async function extractLinkedInIntentSignals(
    context: ScanContext
): Promise<IntentLeadsPayload[]> {
    return extractIntentPayloads(context, {
        containers: [
            // Stable URN-based selectors (most reliable across LinkedIn DOM changes)
            'div[data-urn*="activity"]',
            'div[data-activity-urn]',
            // Classic feed containers
            'div.feed-shared-update-v2',
            'div.occludable-update',
            // Comments
            'article.comments-comment-entity',
            'div.comments-comment-item',
            'article',
        ],
        text: [
            // Post body text — multiple fallbacks for LinkedIn's varying class names
            'span.break-words',
            'div.update-components-text span',
            'div.update-components-text',
            'div[class*="attributed-text-segment-list"] span',
            'div.feed-shared-inline-show-more-text',
            'div.feed-shared-update-v2__description span',
            'div.comments-comment-item__main-content',
        ],
        authorName: [
            'span.update-components-actor__name > span:first-child',
            'span.update-components-actor__name',
            'a.update-components-actor__meta-link span:not(.visually-hidden)',
            'span.comments-post-meta__name-text',
            'span.comments-comment-item__inline-show-more-text',
            'a[href*="/in/"] > span',
        ],
        authorBio: [
            'span.update-components-actor__description > span:first-child',
            'span.update-components-actor__description',
            'span.update-components-actor__sub-description-container span',
            'span.comments-post-meta__headline',
        ],
        authorLink: [
            'a.update-components-actor__meta-link',
            'a[href*="linkedin.com/in/"]',
            'a[href*="/in/"]',
            'a[href*="/company/"]',
            'a[href*="/school/"]',
        ],
        sourceLink: [
            'a[href*="/feed/update/"]',
            'a[href*="/posts/"]',
            'a[href*="linkedin.com/posts/"]',
        ],
        timestamp: ['time[datetime]', 'a[href*="/feed/update/"] time', 'time'],
    })
}
