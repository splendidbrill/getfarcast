import { startPassiveScan } from './passive-scan'
import { scanRedditPage } from '../platform/reddit/scanner'

startPassiveScan({
    platform: 'reddit',
    label: 'Reddit',
    scan: scanRedditPage
})
