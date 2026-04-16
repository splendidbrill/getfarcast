import { startPassiveScan } from './passive-scan'
import { scanTwitterPage } from '../platform/twitter/scanner'

startPassiveScan({
    platform: 'twitter_x',
    label: 'Twitter',
    scan: scanTwitterPage
})
