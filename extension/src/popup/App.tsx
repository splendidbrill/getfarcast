import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_API_BASE_URL, STORAGE_KEYS, STORAGE_KEYS_EXTRA } from '../shared/constants';
import { MessageType, sendRuntimeMessage } from '../shared/messaging';
import type { ActivePlaybook } from '../shared/types';

interface QueuedPost {
    id: string;
    content: string;
    platform: 'twitter' | 'linkedin';
    scheduled_for: string;
    status: string;
}

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
    const [icpQuery, setIcpQuery] = useState('');
    const [platform, setPlatform] = useState<'linkedin' | 'reddit'>('linkedin');
    const [xraySearching, setXraySearching] = useState(false);
    const [xrayStatus, setXrayStatus] = useState('');
    const [activePlaybooks, setActivePlaybooks] = useState<ActivePlaybook[]>([]);
    const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'overview' | 'posts'>('overview');
    const [pendingPosts, setPendingPosts] = useState<QueuedPost[]>([]);
    const [deployingId, setDeployingId] = useState<string | null>(null);
    const [deployStatus, setDeployStatus] = useState<Record<string, string>>({});

    useEffect(() => {
        chrome.storage.local.get(
            [
                STORAGE_KEYS.CONNECTED_HANDLES,
                STORAGE_KEYS.CAPTURED_LEAD_IDS,
                STORAGE_KEYS.LAST_SYNC_AT,
                STORAGE_KEYS.API_BASE_URL,
                STORAGE_KEYS.FARCAST_AUTH_TOKEN,
                STORAGE_KEYS.ACTIVE_PLAYBOOKS
            ],
            (result: Record<string, unknown>) => {
                const handles = result[STORAGE_KEYS.CONNECTED_HANDLES] as
                    | { twitter?: string; reddit?: string; linkedin?: string }
                    | undefined;

                const displayHandle = handles?.twitter ?? handles?.linkedin ?? handles?.reddit ?? 'Not connected';
                const capturedLeadIds = (result[STORAGE_KEYS.CAPTURED_LEAD_IDS] as string[] | undefined) ?? [];
                const playbooks = (result[STORAGE_KEYS.ACTIVE_PLAYBOOKS] as ActivePlaybook[] | undefined) ?? [];

                setStats((current) => ({
                    ...current,
                    connectedAs: displayHandle,
                    leadsCapturedToday: capturedLeadIds.length,
                    trackedContentPieces: 0,
                    apiBaseUrl: (result[STORAGE_KEYS.API_BASE_URL] as string | undefined) ?? DEFAULT_API_BASE_URL,
                    lastSyncAt: (result[STORAGE_KEYS.LAST_SYNC_AT] as string | undefined) ?? null,
                    hasAuthToken: !!result[STORAGE_KEYS.FARCAST_AUTH_TOKEN]
                }));

                setActivePlaybooks(playbooks);
                if (playbooks.length > 0) {
                    setSelectedPlaybookId(playbooks[0].playbook_id);
                }

                const posts = (result[STORAGE_KEYS_EXTRA.PENDING_POSTS] as QueuedPost[] | undefined) ?? [];
                setPendingPosts(posts);
            }
        );
    }, []);

    const dashboardUrl = useMemo(() => `${stats.apiBaseUrl.replace(/\/$/, '')}/dashboard`, [stats.apiBaseUrl]);
    const apiBase = stats.apiBaseUrl.replace(/\/$/, '');

    const handleDeploy = async (post: QueuedPost) => {
        setDeployingId(post.id);
        setDeployStatus((s) => ({ ...s, [post.id]: 'Finding tab…' }));

        const urlPattern = post.platform === 'twitter'
            ? ['https://x.com/*', 'https://twitter.com/*']
            : ['https://www.linkedin.com/*'];

        let tab: { id?: number; url?: string } | undefined;
        for (const pattern of urlPattern) {
            const tabs = await new Promise<{ id?: number; url?: string }[]>((resolve) =>
                chrome.tabs.query({ url: pattern }, resolve)
            );
            if (tabs.length > 0) { tab = tabs[0]; break; }
        }

        if (!tab?.id) {
            const platformUrl = post.platform === 'twitter' ? 'https://x.com' : 'https://www.linkedin.com/feed/';
            setDeployStatus((s) => ({ ...s, [post.id]: `Open ${post.platform === 'twitter' ? 'X.com' : 'LinkedIn'} first` }));
            chrome.tabs.create({ url: platformUrl });
            setDeployingId(null);
            return;
        }

        setDeployStatus((s) => ({ ...s, [post.id]: 'Opening composer…' }));

        try {
            await chrome.tabs.update(tab.id, { active: true });
            const result = await chrome.tabs.sendMessage(tab.id, {
                type: 'DEPLOY_QUEUED_POST',
                payload: post,
            }) as { ok: boolean; error?: string };

            if (result?.ok) {
                setDeployStatus((s) => ({ ...s, [post.id]: '✓ Post is ready — hit Post!' }));
                // Mark as deployed in API (fire and forget)
                const authToken = await new Promise<string | null>((resolve) =>
                    chrome.storage.local.get(STORAGE_KEYS.FARCAST_AUTH_TOKEN, (r: Record<string, unknown>) =>
                        resolve((r[STORAGE_KEYS.FARCAST_AUTH_TOKEN] as string) ?? null)
                    )
                );
                if (authToken) {
                    void fetch(`${apiBase}/api/agent/queue`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                        body: JSON.stringify({ id: post.id, status: 'deployed' }),
                    });
                }
                setPendingPosts((prev) => prev.filter((p) => p.id !== post.id));
            } else {
                setDeployStatus((s) => ({ ...s, [post.id]: result?.error ?? 'Failed' }));
            }
        } catch {
            setDeployStatus((s) => ({ ...s, [post.id]: 'Error — is the extension active on that tab?' }));
        }

        setDeployingId(null);
    };

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

            setStatusMessage(response?.ok ? 'Sync completed' : 'Sync failed');

            if (response?.lastSyncAt) {
                setStats((current) => ({ ...current, lastSyncAt: response?.lastSyncAt ?? null }));
            }
        } catch (error) {
            console.error('[Farcast][Popup] Sync failed', error);
            setStatusMessage('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const handleXraySearch = async () => {
        if (!icpQuery) return;
        setXraySearching(true);
        setXrayStatus('Running X-Ray search...');
        
        try {
            const response = await sendRuntimeMessage<{ ok: boolean; error?: string; leadsCount?: number }>({
                type: MessageType.TRIGGER_XRAY_SEARCH,
                payload: { icpQuery, platform, playbookId: selectedPlaybookId || undefined }
            });
            
            if (response?.ok) {
                setXrayStatus(`Success! Found ${response.leadsCount ?? 0} leads.`);
            } else {
                setXrayStatus(`Search failed: ${response?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('[Farcast][Popup] X-Ray search failed', error);
            setXrayStatus('Search failed');
        } finally {
            setXraySearching(false);
        }
    };

    return (
        <main className="w-[360px] bg-farcast-sand p-4 text-farcast-ink">
            <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-card">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-farcast-orange">Farcast</p>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Extension</h1>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Passive mode
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1">
                    {(['overview', 'posts'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all ${
                                activeTab === tab
                                    ? 'bg-white text-farcast-ink shadow-sm'
                                    : 'text-gray-500 hover:text-farcast-ink'
                            }`}
                        >
                            {tab === 'posts'
                                ? `Posts${pendingPosts.length > 0 ? ` (${pendingPosts.length})` : ''}`
                                : 'Overview'}
                        </button>
                    ))}
                </div>

                {/* Posts tab */}
                {activeTab === 'posts' && (
                    <div className="space-y-3">
                        {pendingPosts.length === 0 ? (
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                                <p className="text-xs font-semibold text-gray-400">No posts scheduled</p>
                                <p className="mt-1 text-xs text-gray-400">Queue posts from your Farcast dashboard</p>
                            </div>
                        ) : (
                            pendingPosts.map((post) => (
                                <div key={post.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                            post.platform === 'twitter'
                                                ? 'bg-slate-100 text-slate-700'
                                                : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {post.platform === 'twitter' ? 'X / Twitter' : 'LinkedIn'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-3">{post.content}</p>
                                    {deployStatus[post.id] && (
                                        <p className="text-xs font-semibold text-farcast-orange">{deployStatus[post.id]}</p>
                                    )}
                                    <button
                                        onClick={() => void handleDeploy(post)}
                                        disabled={deployingId === post.id}
                                        className="w-full rounded-xl bg-farcast-orange py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                                    >
                                        {deployingId === post.id ? 'Working…' : '⚡ Deploy'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Overview tab */}
                {activeTab === 'overview' && <>
                <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <h2 className="mb-2 text-sm font-bold text-farcast-ink">Google X-Ray Search</h2>
                    <input
                        type="text"
                        placeholder="ICP Query (e.g. founder, marketer)"
                        value={icpQuery}
                        onChange={(e) => setIcpQuery(e.target.value)}
                        className="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-farcast-orange"
                    />
                    {activePlaybooks.length > 0 && (
                        <select
                            value={selectedPlaybookId}
                            onChange={(e) => setSelectedPlaybookId(e.target.value)}
                            className="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-farcast-orange"
                        >
                            {activePlaybooks.map((pb) => (
                                <option key={pb.playbook_id} value={pb.playbook_id}>
                                    {pb.product_name}
                                </option>
                            ))}
                        </select>
                    )}
                    <div className="flex gap-2">
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value as 'linkedin' | 'reddit')}
                            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-farcast-orange"
                        >
                            <option value="linkedin">LinkedIn</option>
                            <option value="reddit">Reddit</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleXraySearch}
                            disabled={xraySearching || !icpQuery}
                            className="rounded-xl bg-farcast-orange px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {xraySearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                    {xrayStatus && <p className="mt-2 text-xs font-medium text-gray-500">{xrayStatus}</p>}
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
                </>}
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
