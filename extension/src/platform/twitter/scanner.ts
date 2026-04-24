import { extractTwitterEngagerLeads } from './engagers';
import { extractTwitterIntentSignals } from './intent';
import { extractTwitterPerformanceSignals } from './performance';
import type { ScanContext } from '../../shared/types';

export async function scanTwitterPage(context: ScanContext) {
    return {
        performance: await extractTwitterPerformanceSignals(context),
        engagerLeads: await extractTwitterEngagerLeads(context),
        intentSignals: await extractTwitterIntentSignals(context)
    };
}
