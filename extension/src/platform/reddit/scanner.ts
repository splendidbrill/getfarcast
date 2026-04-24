import { extractRedditEngagerLeads } from './engagers';
import { extractRedditIntentSignals } from './intent';
import { extractRedditPerformanceSignals } from './performance';
import type { ScanContext } from '../../shared/types';

export async function scanRedditPage(context: ScanContext) {
    return {
        performance: await extractRedditPerformanceSignals(context),
        engagerLeads: await extractRedditEngagerLeads(context),
        intentSignals: await extractRedditIntentSignals(context)
    };
}
