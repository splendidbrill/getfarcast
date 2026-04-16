import type { EngagerLeadsPayload, ScanContext } from '../../shared/types';

export async function extractRedditEngagerLeads(
    context: ScanContext
): Promise<EngagerLeadsPayload | null> {
    void context;

    // Skeleton only:
    // - extract commenter usernames and comment previews from the current page
    // - do not deduplicate client-side beyond basic local bookkeeping
    return null;
}
