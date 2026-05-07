import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="ld-footer">
      <div className="ld-container">
        <div className="ld-footer-grid">
          <div className="ld-footer-brand">
            <Link className="ld-brand" href="/">
              <span className="ld-brand-mark">F</span>
              <span>Farcast</span>
            </Link>
            <p>The AI Growth Co-Founder for micro SaaS teams. We do the growth thinking. You do the shipping.</p>
          </div>
          <div className="ld-footer-col">
            <h5>Product</h5>
            <ul>
              <li><a href="#dashboard">Dashboard</a></li>
              <li><a href="#extension">Chrome Extension</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQs</a></li>
            </ul>
          </div>
          <div className="ld-footer-col">
            <h5>Company</h5>
            <ul>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="ld-footer-col">
            <h5>Legal</h5>
            <ul>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="ld-footer-bot">
          <span>© 2026 Farcast. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
