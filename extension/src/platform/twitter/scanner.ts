import { extractTwitterIntentSignals } from './intent';
import type { ScanContext } from '../../shared/types';

export async function scanTwitterPage(context: ScanContext) {
    return {
        intentSignals: await extractTwitterIntentSignals(context)
    };
}
