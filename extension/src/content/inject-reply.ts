import { MessageType, sendRuntimeMessage } from '../shared/messaging';
import type { GenerateAiReplyResponse } from '../shared/messaging';

type Platform = 'twitter' | 'linkedin' | 'reddit';

const FC_SENTINEL = 'data-fc-reply-injected';

// ─── Platform detection ───────────────────────────────────────────────────────

function getPlatform(): Platform | null {
    const h = location.hostname;
    if (h === 'x.com' || h.endsWith('.x.com') || h === 'twitter.com') return 'twitter';
    if (h === 'www.linkedin.com' || h === 'linkedin.com') return 'linkedin';
    if (h === 'www.reddit.com' || h === 'old.reddit.com' || h === 'reddit.com') return 'reddit';
    return null;
}

// ─── Submit button selectors (aria-label anchored for resilience) ─────────────

// Keyed by platform, ordered most-specific first.
const SUBMIT_SELECTORS: Record<Platform, string[]> = {
    twitter: [
        '[data-testid="tweetButtonInline"]', // inline reply below a tweet
        '[data-testid="tweetButton"]',        // main compose modal
    ],
    linkedin: [
        '[aria-label="Post comment"]',
        'button[aria-label*="comment" i][type="submit"]',
        '.comments-comment-box__submit-button',
        'button.comments-comment-texteditor__submitButton',
        '[data-control-name="comment.post"]',
        'button[class*="comments-comment"][class*="submit"]',
    ],
    reddit: [
        'button.button-primary[rpl]',  // new Reddit (shreddit) — rpl is Reddit's Lit element marker
        '.usertext-edit .save',        // old Reddit
    ],
};

// ─── Post text extraction ─────────────────────────────────────────────────────

// Walk up from an element collecting ancestors (bounded traversal).
function ancestors(el: HTMLElement, limit = 14): HTMLElement[] {
    const result: HTMLElement[] = [];
    let cur: HTMLElement | null = el.parentElement;
    while (cur && result.length < limit) {
        result.push(cur);
        cur = cur.parentElement;
    }
    return result;
}

function extractTwitterPostText(submitBtn: HTMLElement): string {
    // X puts the original tweet in [data-testid="tweetText"] inside the same
    // inline-reply container as the compose area. Walk up until we find it.
    for (const ancestor of ancestors(submitBtn)) {
        const tweetTexts = ancestor.querySelectorAll<HTMLElement>('[data-testid="tweetText"]');
        if (tweetTexts.length > 0) {
            return tweetTexts[0].textContent?.trim() ?? '';
        }
    }
    // Last-resort: grab the first visible tweet text on the page.
    return document.querySelector<HTMLElement>('[data-testid="tweetText"]')?.textContent?.trim() ?? '';
}

function extractLinkedInPostText(submitBtn: HTMLElement): string {
    // Walk up to the nearest article or feed item and grab the post body.
    for (const ancestor of ancestors(submitBtn)) {
        const textEl = ancestor.querySelector<HTMLElement>(
            '.feed-shared-text, .update-components-text, [class*="commentary"], [class*="update-v2__description"]'
        );
        if (textEl) return textEl.textContent?.trim() ?? '';
    }
    return '';
}

function extractRedditPostText(_submitBtn: HTMLElement): string {
    // New Reddit (shreddit) — the post lives outside the comment box in a separate container.
    const postContainer = document.querySelector<HTMLElement>(
        '[data-testid="post-container"], shreddit-post, [data-test-id="post-content"]'
    );
    if (postContainer) {
        const title = postContainer.querySelector<HTMLElement>(
            'h1, [data-click-id="text"] h3, [data-testid="post-title"]'
        );
        const body = postContainer.querySelector<HTMLElement>(
            '[data-testid="post-content"], .RichTextJSON-root, [class*="usertext-body"]'
        );
        return [title?.textContent, body?.textContent]
            .filter(Boolean)
            .join(' ')
            .trim()
            .slice(0, 800);
    }
    // Old Reddit fallback.
    return (
        document.querySelector<HTMLElement>('a[data-event-action="title"], p.title > a')
            ?.textContent
            ?.trim() ?? ''
    );
}

// ─── Input element discovery ──────────────────────────────────────────────────

const INPUT_SELECTOR =
    '[data-testid="tweetTextarea_0"][contenteditable="true"],' +
    '[contenteditable="true"][role="textbox"],' +
    '[contenteditable="true"],' +
    'textarea';

// Reddit (shreddit) puts the actual textarea inside shadow roots of
// faceplate-textarea-input / shreddit-composer / comment-composer-host.
// We pierce those roots after the normal light-DOM search fails.
const SHADOW_INPUT_HOSTS = [
    'faceplate-textarea-input',
    'shreddit-composer',
    'comment-composer-host',
];

function findNearestInput(anchor: HTMLElement): HTMLElement | null {
    // 1. Light DOM — fast path for Twitter / LinkedIn
    for (const ancestor of ancestors(anchor, 20)) {
        const el = ancestor.querySelector<HTMLElement>(INPUT_SELECTOR);
        if (el && !el.contains(anchor)) return el;
    }

    // 2. Shadow DOM — Reddit shreddit components
    for (const ancestor of ancestors(anchor, 10)) {
        for (const tag of SHADOW_INPUT_HOSTS) {
            for (const host of ancestor.querySelectorAll<HTMLElement>(tag)) {
                const el = host.shadowRoot?.querySelector<HTMLElement>(INPUT_SELECTOR);
                if (el) return el;
            }
        }
    }

    return null;
}

// ─── Text injection ───────────────────────────────────────────────────────────

// For React-controlled inputs we must go through execCommand so the framework
// sees the mutation as a user-initiated input event.
function injectText(el: HTMLElement, text: string) {
    el.focus();
    if (el instanceof HTMLTextAreaElement) {
        // React overrides the value setter, so restore the native one first.
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
        setter?.call(el, text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        // Scope selection to this element only. document.execCommand('selectAll')
        // can select across element boundaries and, combined with insertText, causes
        // double-insertion in Lexical-based editors (X/Twitter) because the editor
        // handles beforeinput itself AND the browser command also fires.
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);

        // Prefer a synthetic paste event — Lexical/Quill handle it cleanly and call
        // preventDefault(), preventing the execCommand fallback from also running.
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: dt,
        });
        el.dispatchEvent(pasteEvent);

        // Fallback for plain contenteditables that don't intercept paste.
        if (!pasteEvent.defaultPrevented) {
            document.execCommand('insertText', false, text);
        }
    }
}

// ─── Button factory ───────────────────────────────────────────────────────────

function makeFarcastButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-fc-ai-reply', 'true');
    btn.textContent = '⚡ Farcast AI';
    Object.assign(btn.style, {
        background: '#FF5722',
        color: '#fff',
        border: 'none',
        borderRadius: '9999px',
        padding: '0 14px',
        height: '32px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        marginLeft: '8px',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: '0',
        verticalAlign: 'middle',
        lineHeight: '1',
    });
    return btn;
}

// ─── Click handler ────────────────────────────────────────────────────────────

async function onFarcastClick(
    fcBtn: HTMLButtonElement,
    submitBtn: HTMLElement,
    platform: Platform
) {
    const originalText = fcBtn.textContent ?? '⚡ Farcast AI';
    fcBtn.textContent = '⏳ Thinking…';
    fcBtn.style.opacity = '0.7';
    fcBtn.disabled = true;

    try {
        let postText = '';
        if (platform === 'twitter') postText = extractTwitterPostText(submitBtn);
        else if (platform === 'linkedin') postText = extractLinkedInPostText(submitBtn);
        else postText = extractRedditPostText(submitBtn);

        if (!postText) {
            fcBtn.textContent = '⚠️ No post text';
            reset(fcBtn, originalText, 2200);
            return;
        }

        const result = await sendRuntimeMessage<GenerateAiReplyResponse>({
            type: MessageType.GENERATE_AI_REPLY,
            payload: { platform, postText },
        });

        if (!result?.ok) {
            throw new Error((result as { ok: false; error: string } | null)?.error ?? 'No reply returned');
        }

        const input = findNearestInput(submitBtn);
        if (input) {
            injectText(input, result.reply);
            fcBtn.textContent = '✓ Done';
            fcBtn.style.background = '#4CAF50';
        } else {
            await navigator.clipboard.writeText(result.reply);
            fcBtn.textContent = '📋 Copied!';
        }
    } catch (err) {
        console.error('[Farcast] AI reply failed', err);
        fcBtn.textContent = '✕ Error';
        fcBtn.style.background = '#f44336';
    }

    reset(fcBtn, originalText, 2500);
}

function reset(btn: HTMLButtonElement, label: string, delay: number) {
    setTimeout(() => {
        btn.textContent = label;
        btn.style.background = '#FF5722';
        btn.style.opacity = '1';
        btn.disabled = false;
    }, delay);
}

// ─── Injection ────────────────────────────────────────────────────────────────

// When the submit button is inside a web-component (tag name contains '-'),
// shadow-slot CSS suppresses any sibling we inject into the light DOM.
// Instead we mount the button on document.body as a fixed overlay, positioned
// next to the submit button via getBoundingClientRect().
function mountFloating(fcBtn: HTMLButtonElement, anchor: HTMLElement) {
    Object.assign(fcBtn.style, {
        position: 'fixed',
        zIndex: '2147483647',
        marginLeft: '0',
        marginTop: '0',
        display: 'none',
    });
    document.body.appendChild(fcBtn);

    let alive = true;

    function sync() {
        if (!alive) return;
        if (!document.body.contains(anchor)) {
            alive = false;
            fcBtn.remove();
            clearInterval(timer);
            return;
        }
        const r = anchor.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) {
            fcBtn.style.display = 'none';
        } else {
            fcBtn.style.display = 'inline-flex';
            fcBtn.style.top = `${r.top + (r.height - 32) / 2}px`;
            fcBtn.style.left = `${r.right + 8}px`;
        }
    }

    const timer = setInterval(sync, 300);
    sync();
}

function tryInject(submitBtn: HTMLElement, platform: Platform) {
    if (submitBtn.hasAttribute(FC_SENTINEL)) return;
    if (!findNearestInput(submitBtn)) return;
    submitBtn.setAttribute(FC_SENTINEL, '1');

    const fcBtn = makeFarcastButton();
    fcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        void onFarcastClick(fcBtn, submitBtn, platform);
    });

    if (submitBtn.parentElement?.tagName.includes('-')) {
        mountFloating(fcBtn, submitBtn);
    } else {
        submitBtn.insertAdjacentElement('afterend', fcBtn);
    }
}

function scanAndInject(platform: Platform) {
    for (const selector of SUBMIT_SELECTORS[platform]) {
        document.querySelectorAll<HTMLElement>(selector).forEach((btn) => {
            tryInject(btn, platform);
        });
    }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function initReplyInjector() {
    const platform = getPlatform();
    if (!platform) return;

    // Debounce DOM-mutation scans to avoid thrashing on rapid re-renders.
    let pending: ReturnType<typeof setTimeout> | null = null;
    function scheduleScan() {
        if (pending) return;
        pending = setTimeout(() => {
            pending = null;
            scanAndInject(platform!);
        }, 200);
    }

    scanAndInject(platform);

    new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'childList' && m.addedNodes.length > 0) {
                scheduleScan();
                return;
            }
        }
    }).observe(document.body, { childList: true, subtree: true });

    // Reddit reveals the composer by toggling attributes/classes rather than
    // inserting new nodes, so the MutationObserver misses it. A post-click scan
    // catches the newly visible submit button.
    document.addEventListener('click', scheduleScan, true);
}
