export function LandingBento() {
  return (
    <section id="dashboard" className="ld-section">
      <div className="ld-container">
        <div className="ld-section-head">
          <span className="ld-section-eyebrow">THE STRATEGY · YOUR GROWTH DASHBOARD</span>
          <h2 className="ld-section-title">Every part of Growth, already thought through.</h2>
          <p className="ld-section-lede">Read what to do in 60 seconds, execute in 5 minutes. Here is exactly what is inside:</p>
        </div>

        <div className="ld-bento">
          {/* 1 Daily To-Do */}
          <div className="ld-bento-card b1">
            <span className="num">01 / DAILY TO-DO</span>
            <h3>The Daily To-Do List</h3>
            <p>Wake up to a daily growth checklist. Ready-to-publish posts on Reddit, X and Linkedin; new warm leads, and fresh out of the box growth hacks - sequenced for the next 20 minutes of your morning.</p>
            <div className="visual" style={{ height: 196 }}>
              <div className="ld-mini-checks">
                <div className="ld-mini-check done"><span className="cb"></span><span>Publish 3 generated posts (Reddit, X, LinkedIn)</span><span className="badge">3/3</span></div>
                <div className="ld-mini-check done"><span className="cb"></span><span>Engage with 12 new warm leads</span><span className="badge">12/12</span></div>
                <div className="ld-mini-check"><span className="cb"></span><span>Update Daily Log (Train your AI Ghostwriter)</span><span className="badge">2 MIN</span></div>
                <div className="ld-mini-check growth"><span className="cb"></span><span><strong>Execute Growth Hack:</strong> Partner with Print-on-Demand Providers</span><span className="badge gh">HACK</span></div>
              </div>
            </div>
          </div>

          {/* 2 ICP */}
          <div className="ld-bento-card b2">
            <span className="num">02 / ICP</span>
            <h3>Deep ICP Profiling</h3>
            <p>Get deep psychographics, buying triggers, and competitor weaknesses for your exact micro-segment of target customers.</p>
            <div className="visual">
              <div className="ld-icp-block">
                <div className="ld-icp-row"><span>Segment</span><strong>Solo B2B Micro-SaaS Developers, &lt; 12mo</strong></div>
                <div className="ld-icp-row"><span>Buying trigger</span><strong>Just shipped, 0 users</strong></div>
                <div className="ld-icp-row"><span>Hangs out at</span><strong>r/SaaS · X build-in-public</strong></div>
                <div className="ld-icp-row"><span>Pain point</span><strong>&ldquo;I can ship, I can&apos;t sell&rdquo;</strong></div>
              </div>
            </div>
          </div>

          {/* 3 Market */}
          <div className="ld-bento-card b3">
            <span className="num">03 / MARKET INTEL</span>
            <h3>Market Intel</h3>
            <p>Instant executive summaries of your TAM/SAM/SOM. Sized, sourced, and broken down by channel and market trends.</p>
            <div className="visual">
              <div className="ld-market-bar">
                <div className="row"><span className="lbl">TAM</span><span className="track"><span className="fill" style={{ width: "100%" }}></span></span><span className="val">$12.4B</span></div>
                <div className="row"><span className="lbl">SAM</span><span className="track"><span className="fill" style={{ width: "48%" }}></span></span><span className="val">$5.9B</span></div>
                <div className="row"><span className="lbl">SOM</span><span className="track"><span className="fill" style={{ width: "14%" }}></span></span><span className="val">$1.7B</span></div>
              </div>
            </div>
          </div>

          {/* 4 Playbooks */}
          <div className="ld-bento-card b4">
            <span className="num">04 / PLAYBOOKS</span>
            <h3>Omnichannel Playbooks</h3>
            <p>Strategic guides on exactly what works across your core platforms.</p>
            <div className="visual">
              <div className="ld-playbook-tabs">
                <div className="ld-pb-tab active"><span className="icn">𝕏</span><span>X</span></div>
                <div className="ld-pb-tab"><span className="icn">R</span><span>Reddit</span></div>
                <div className="ld-pb-tab"><span className="icn">in</span><span>LinkedIn</span></div>
              </div>
            </div>
          </div>

          {/* 5 Leads */}
          <div className="ld-bento-card b5">
            <span className="num">05 / WARM LEADS</span>
            <h3>The Warm Lead Vault</h3>
            <p>A database of every high-intent lead Farcast has found for you, sorted by readiness to buy, scored daily.</p>
            <div className="visual">
              <div className="ld-leads-list">
                <div className="ld-lead-row">
                  <span className="ld-lead-av"></span>
                  <span><span className="name">@dev_marta</span> <span className="meta">· asked about cold email tools, X</span></span>
                  <span className="score">94</span>
                </div>
                <div className="ld-lead-row">
                  <span className="ld-lead-av" style={{ background: "linear-gradient(135deg,#BCE4D0,#5BA988)" }}></span>
                  <span><span className="name">u/launchwithjon</span> <span className="meta">· &ldquo;any tools for ICP?&rdquo;, r/SaaS</span></span>
                  <span className="score">88</span>
                </div>
                <div className="ld-lead-row">
                  <span className="ld-lead-av" style={{ background: "linear-gradient(135deg,#C9D2FF,#6B7CFF)" }}></span>
                  <span><span className="name">Priya · Indie founder</span> <span className="meta">· LinkedIn, 3rd connection</span></span>
                  <span className="score">82</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
