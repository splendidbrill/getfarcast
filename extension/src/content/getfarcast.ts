function signal() {
  window.dispatchEvent(new CustomEvent("farcast-extension-installed"));
}

// Fire immediately and at intervals — Next.js hydration may not complete
// before document_start, so we retry within the detection window (1500ms).
signal();
setTimeout(signal, 200);
setTimeout(signal, 700);
