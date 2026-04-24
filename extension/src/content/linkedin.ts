import { startPassiveScan } from './passive-scan'
import { scanLinkedInPage } from '../platform/linkedin/scanner'

startPassiveScan({
    platform: 'linkedin',
    label: 'LinkedIn',
    scan: scanLinkedInPage
})
