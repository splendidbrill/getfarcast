export function LandingExtension() {
  return (
    <section id="extension" className="ld-section ld-ext-section">
      <div className="ld-container">
        <div className="ld-ext-grid">
          <div className="ld-feed-mock">
            <div className="feed-header">
              <span className="ph-ico">𝕏</span>
              <span className="ph-name">For you</span>
              <span className="ph-meta">x.com/home</span>
            </div>
            <div className="ld-feed-post">
              <div className="author-row">
                <span className="author-av"></span>
                <span className="author-name">Jake Builds</span>
                <span className="author-handle">@buildwithjake · 2h</span>
              </div>
              <p className="post-text">What&apos;s the actual workflow people use to stay consistent on X without losing 2 hours a day to scrolling?</p>
              <div className="post-actions"><span>↩ 47</span><span>↻ 12</span><span>♡ 219</span></div>
            </div>
            <div className="ld-feed-post" style={{ borderBottom: "none" }}>
              <div className="author-row">
                <span className="author-av" style={{ background: "linear-gradient(135deg,#FFCDB8,#FF8A66)" }}></span>
                <span className="author-name">Priya Shah</span>
                <span className="author-handle">@priyabuilds · 5h</span>
              </div>
              <p className="post-text">Day 21 of building in public. ICP feels finally locked in...</p>
            </div>

            <div className="ld-ext-overlay">
              <div className="ld-ext-header">
                <span className="ext-mark">F</span>
                <span className="ext-title">Reply Ghostwriter</span>
                <span className="ext-sub">on @buildwithjake</span>
              </div>
              <div className="ld-ext-reply">
                <div className="ld-ext-reply-label">Suggested · sounds like you</div>
                <div className="ld-ext-reply-body">Honestly, batching helps but the real unlock was a daily checklist that picks the threads worth replying to. Saves the what do I even say tax.</div>
              </div>
              <div className="ld-ext-footer">
                <span className="ld-ext-tone active">Founder</span>
                <span className="ld-ext-tone">Witty</span>
                <span className="ld-ext-tone">Direct</span>
                <span className="ld-ext-send">Insert ↵</span>
              </div>
            </div>
          </div>

          <div>
            <span className="ld-section-eyebrow">The Execution · Chrome Extension</span>
            <h2 className="ld-section-title">Your personal &ldquo;Reply Guy&rdquo; Ghostwriter.</h2>
            <p className="ld-section-lede">Don&apos;t know what to comment? Our Chrome extension sits directly on X and Reddit. It reads the context of the post and drafts a hyper-relevant, human-sounding reply designed to get upvotes and likes.</p>

            <div className="ld-feature-list">
              <div className="ld-feature-item">
                <span className="fi-ico">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </span>
                <div className="fi-text">
                  <h4>Context-aware in real time</h4>
                  <p>Reads the parent thread, replies above you, and the author&apos;s voice — drafts a reply that fits the conversation, not a generic platitude.</p>
                </div>
              </div>
              <div className="ld-feature-item">
                <span className="fi-ico">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 12l4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div className="fi-text">
                  <h4>Tuned for upvotes, not engagement bait</h4>
                  <p>Trained on the kinds of replies that actually get likes and upvotes from technical audiences — not &ldquo;Great post!&rdquo; filler.</p>
                </div>
              </div>
              <div className="ld-feature-item">
                <span className="fi-ico">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M7 10h6M7 7h6M7 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </span>
                <div className="fi-text">
                  <h4>You stay in control</h4>
                  <p>Edit, regenerate, or pick a different tone before you post. Every reply ships from your account, your fingers, your reputation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
