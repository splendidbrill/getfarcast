import type { ContentPerformancePayload, ScanContext } from '../../shared/types';

export async function extractLinkedInPerformanceSignals(
    context: ScanContext
): Promise<ContentPerformancePayload | null> {
    void context;

    // Skeleton only:
    // - resolve activity/post identifiers from URL
    // - read visible metrics via OTA selectors
    return null;
}
