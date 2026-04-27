import { startPassiveScan } from './passive-scan'
import { scanLinkedInPage } from '../platform/linkedin/scanner'
import { initReplyInjector } from './inject-reply'

startPassiveScan({
    platform: 'linkedin',
    label: 'LinkedIn',
    scan: scanLinkedInPage
})

initReplyInjector()
