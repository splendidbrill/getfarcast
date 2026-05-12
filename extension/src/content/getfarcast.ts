function signal() {
  document.documentElement.setAttribute('data-farcast-installed', '1');
  // Expose the real extension ID so the page can use it for external messaging
  // regardless of whether this is an unpacked dev build or the published CWS extension.
  document.documentElement.setAttribute('data-farcast-id', chrome.runtime.id);
  window.dispatchEvent(new CustomEvent("farcast-extension-installed"));
}

// Fire immediately and at intervals — Next.js hydration may not complete
// before document_start, so we retry within the detection window (1500ms).
signal();
setTimeout(signal, 200);
setTimeout(signal, 700);

// Relay search requests from the dashboard to the background service worker.
// postMessage is used for page → content script because CustomEvents don't
// reliably cross Chrome's isolated-world boundary in that direction.
window.addEventListener('message', async (e) => {
  if (e.source !== window) return;
  if (!e.data || e.data.type !== 'farcast-trigger-search') return;

  const { queries, platform, playbookId } = e.data as {
    queries: string[];
    platform: 'reddit' | 'linkedin';
    playbookId: string;
  };

  let totalLeads = 0;

  for (const icpQuery of queries) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRIGGER_XRAY_SEARCH',
        payload: { icpQuery, platform, playbookId },
      }) as { ok: boolean; leadsCount?: number } | null;

      if (response?.ok) {
        totalLeads += response.leadsCount ?? 0;
      }
    } catch (err) {
      console.warn('[Farcast] xray relay failed for query:', icpQuery, err);
    }
  }

  // CustomEvent back to the page works fine in the content script → page direction.
  window.dispatchEvent(
    new CustomEvent('farcast-search-complete', { detail: { ok: true, totalLeads } })
  );
});
