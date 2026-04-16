import type { EngagerLeadsPayload, ScanContext } from '../../shared/types';

export async function extractLinkedInEngagerLeads(
    context: ScanContext
): Promise<EngagerLeadsPayload | null> {
    void context;

    // Skeleton only:
    // - read reactors and commenters from visible engagement panels
    // - rely on backend uniqueness constraints for final deduplication
    return null;
}
