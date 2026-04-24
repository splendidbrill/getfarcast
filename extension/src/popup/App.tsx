import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL, STORAGE_KEYS } from '../shared/constants';
import { MessageType, sendRuntimeMessage } from '../shared/messaging';

type PopupStats = {
    connectedAs: string;
    leadsCapturedToday: number;
    trackedContentPieces: number;
    apiBaseUrl: string;
    lastSyncAt: string | null;
    hasAuthToken: boolean;
};

const initialStats: PopupStats = {
    connectedAs: 'Not connected',
    leadsCapturedToday: 0,
    trackedContentPieces: 0,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    lastSyncAt: null,
    hasAuthToken: false
};

export default function App() {
    const [stats, setStats] = useState<PopupStats>(initialStats);
    const [syncing, setSyncing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Idle');

    useEffect(() => {
        chrome.storage.local.get(
            [
                STORAGE_KEYS.CONNECTED_HANDLES,
                STORAGE_KEYS.CAPTURED_LEAD_IDS,
                STORAGE_KEYS.LAST_SYNC_AT,
                STORAGE_KEYS.API_BASE_URL,
                STORAGE_KEYS.FARCAST_AUTH_TOKEN
            ],
            (result: Record<string, unknown>) => {
                const handles = result[STORAGE_KEYS.CONNECTED_HANDLES] as
                    | { twitter?: string; reddit?: string; linkedin?: string }
                    | undefined;

                const displayHandle = handles?.twitter ?? handles?.linkedin ?? handles?.reddit ?? 'Not connected';
                const capturedLeadIds = (result[STORAGE_KEYS.CAPTURED_LEAD_IDS] as string[] | undefined) ?? [];

                setStats((current) => ({
                    ...current,
                    connectedAs: displayHandle,
                    leadsCapturedToday: capturedLeadIds.length,
                    trackedContentPieces: 0,
                    apiBaseUrl: (result[STORAGE_KEYS.API_BASE_URL] as string | undefined) ?? DEFAULT_API_BASE_URL,
                    lastSyncAt: (result[STORAGE_KEYS.LAST_SYNC_AT] as string | undefined) ?? null,
                    hasAuthToken: !!result[STORAGE_KEYS.FARCAST_AUTH_TOKEN]
                }));
            }
        );
    }, []);

    const dashboardUrl = useMemo(() => `${stats.apiBaseUrl.replace(/\/$/, '')}/dashboard`, [stats.apiBaseUrl]);

    const handleConnect = () => {
        const connectUrl = `${stats.apiBaseUrl.replace(/\/$/, '')}/connect-extension?extId=${chrome.runtime.id}`;
        chrome.tabs.create({ url: connectUrl });
    };

    const handleSyncNow = async () => {
        setSyncing(true);
        setStatusMessage('Syncing configuration...');

        try {
            const response = await sendRuntimeMessage<{ ok: boolean; lastSyncAt?: string }>({
                type: MessageType.SYNC_NOW
            });

            setStatusMessage(response.ok ? 'Sync completed' : 'Sync failed');

            if (response.lastSyncAt) {
                setStats((current) => ({ ...current, lastSyncAt: response.lastSyncAt ?? null }));
            }
        } catch (error) {
            console.error('[Farcast][Popup] Sync failed', error);
            setStatusMessage('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <main className="w-[360px] bg-farcast-sand p-4 text-farcast-ink">
            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-card">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-farcast-orange">Farcast</p>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Extension Status</h1>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Passive mode
                    </div>
                </div>

                <div className="space-y-3 text-sm">
                    <InfoRow label="Connected as" value={stats.connectedAs} />
                    <InfoRow label="Leads captured today" value={String(stats.leadsCapturedToday)} />
                    <InfoRow label="Content pieces tracked" value={String(stats.trackedContentPieces)} />
                    <InfoRow label="Last sync" value={stats.lastSyncAt ?? 'Never'} />
                    <InfoRow label="API base URL" value={stats.apiBaseUrl} />
                </div>

                {!stats.hasAuthToken ? (
                    <button
                        type="button"
                        onClick={handleConnect}
                        className="mt-5 w-full rounded-2xl bg-farcast-orange px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                    >
                        Connect Account
                    </button>
                ) : (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <a
                            href={dashboardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl bg-farcast-ink px-4 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
                        >
                            Open Dashboard
                        </a>

                        <button
                            type="button"
                            onClick={handleSyncNow}
                            disabled={syncing}
                            className="rounded-2xl bg-farcast-orange px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                )}

                <p className="mt-4 text-xs font-medium text-gray-500">{statusMessage}</p>
            </div>
        </main>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
            <span className="font-semibold text-gray-500">{label}</span>
            <span className="max-w-[180px] truncate text-right font-bold text-farcast-ink">{value}</span>
        </div>
    );
}
