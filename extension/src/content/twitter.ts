import { startPassiveScan } from './passive-scan'
import { scanTwitterPage } from '../platform/twitter/scanner'
import { initReplyInjector } from './inject-reply'
import { initQueuePoster } from './queue-poster'

startPassiveScan({
    platform: 'twitter_x',
    label: 'Twitter',
    scan: scanTwitterPage
})

initReplyInjector()
initQueuePoster()
