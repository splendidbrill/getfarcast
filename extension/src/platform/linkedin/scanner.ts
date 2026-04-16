import { extractLinkedInEngagerLeads } from './engagers';
import { extractLinkedInIntentSignals } from './intent';
import { extractLinkedInPerformanceSignals } from './performance';
import type { ScanContext } from '../../shared/types';

export async function scanLinkedInPage(context: ScanContext) {
    return {
        performance: await extractLinkedInPerformanceSignals(context),
        engagerLeads: await extractLinkedInEngagerLeads(context),
        intentSignals: await extractLinkedInIntentSignals(context)
    };
}
