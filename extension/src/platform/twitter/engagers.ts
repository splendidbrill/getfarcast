import type { EngagerLeadsPayload, ScanContext } from '../../shared/types';

export async function extractTwitterEngagerLeads(
    context: ScanContext
): Promise<EngagerLeadsPayload | null> {
    void context;

    // Skeleton only:
    // - read liker / retweeter / replier cards from the current DOM
    // - use OTA selectors from backend config instead of hardcoded constants
    // - submit candidate leads directly to backend and let Postgres/Supabase enforce uniqueness
    return null;
}
