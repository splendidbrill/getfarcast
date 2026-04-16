import type { ContentPerformancePayload, ScanContext } from '../../shared/types';

export async function extractRedditPerformanceSignals(
    context: ScanContext
): Promise<ContentPerformancePayload | null> {
    void context;

    // Skeleton only:
    // - verify the visible post belongs to the connected Reddit handle
    // - read upvotes, ratio, comments, flair, timestamp, and preview using OTA selectors
    return null;
}
