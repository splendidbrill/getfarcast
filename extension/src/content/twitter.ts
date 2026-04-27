import { startPassiveScan } from './passive-scan'
import { scanTwitterPage } from '../platform/twitter/scanner'
import { initReplyInjector } from './inject-reply'

startPassiveScan({
    platform: 'twitter_x',
    label: 'Twitter',
    scan: scanTwitterPage
})

initReplyInjector()
