import { extractIntentPayloads } from '../intent-utils'
import type { IntentLeadsPayload, ScanContext } from '../../shared/types'

export async function extractTwitterIntentSignals(
    context: ScanContext
): Promise<IntentLeadsPayload[]> {
    return extractIntentPayloads(context, {
        containers: ['article[data-testid="tweet"]', 'article', 'div[data-testid="cellInnerDiv"] article'],
        text: ['[data-testid="tweetText"]', 'div[lang]'],
        authorName: ['[data-testid="User-Name"] span', 'a[role="link"] span'],
        authorBio: ['[data-testid="UserDescription"]'],
        authorLink: ['[data-testid="User-Name"] a[href^="/"]', 'a[href*="/status/"]'],
        sourceLink: ['a[href*="/status/"]'],
        timestamp: ['time']
    })
}
