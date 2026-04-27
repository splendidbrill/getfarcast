import { startPassiveScan } from './passive-scan'
import { scanRedditPage } from '../platform/reddit/scanner'
import { MessageType, sendRuntimeMessage } from '../shared/messaging'
import { initReplyInjector } from './inject-reply'

startPassiveScan({
    platform: 'reddit',
    label: 'Reddit',
    scan: scanRedditPage
})

// Trigger server-side background search when user opens Reddit
// Throttled in the service worker to once per 30 minutes
void sendRuntimeMessage({ type: MessageType.TRIGGER_REDDIT_SEARCH })

initReplyInjector()
