import { startPassiveScan } from './passive-scan'
import { scanLinkedInPage } from '../platform/linkedin/scanner'
import { initReplyInjector } from './inject-reply'
import { initQueuePoster } from './queue-poster'

startPassiveScan({
    platform: 'linkedin',
    label: 'LinkedIn',
    scan: scanLinkedInPage
})

initReplyInjector()
initQueuePoster()
