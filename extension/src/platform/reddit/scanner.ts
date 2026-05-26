import { extractRedditIntentSignals } from './intent';
import type { ScanContext } from '../../shared/types';

export async function scanRedditPage(context: ScanContext) {
    return {
        intentSignals: await extractRedditIntentSignals(context)
    };
}
