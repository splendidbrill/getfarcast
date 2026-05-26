import { extractLinkedInIntentSignals } from './intent';
import type { ScanContext } from '../../shared/types';

export async function scanLinkedInPage(context: ScanContext) {
    return {
        intentSignals: await extractLinkedInIntentSignals(context)
    };
}
