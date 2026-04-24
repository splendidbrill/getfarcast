import type { ContentPerformancePayload, ScanContext } from '../../shared/types';

export async function extractTwitterPerformanceSignals(
    context: ScanContext
): Promise<ContentPerformancePayload | null> {
    void context;

    // Skeleton only:
    // - verify this is the user's own post
    // - resolve OTA selectors from context.selectors?.performance
    // - read visible metrics only
    // - send raw payload to backend; deduplication/scoring remain server-side
    return null;
}
