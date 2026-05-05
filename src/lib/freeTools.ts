export interface ToolInput {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea";
}

export interface ToolConfig {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  inputs: ToolInput[];
  outputLabel: string;
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
}

export const FREE_TOOLS: ToolConfig[] = [
  // ── Content Tools ──────────────────────────────────────────────────────────
  {
    slug: "twitter-bio-generator",
    title: "Twitter/X Bio Generator",
    tagline: "3 punchy bio options. Instant, no login.",
    description: "Enter your name, role, and what you post about. Get 3 ready-to-copy bio options.",
    icon: "𝕏",
    inputs: [
      { name: "name", label: "Name or handle", placeholder: "@yourhandle", type: "text" },
      { name: "role", label: "What you do", placeholder: "SaaS founder, indie hacker, growth marketer...", type: "text" },
      { name: "interests", label: "Topics you post about", placeholder: "building in public, AI, B2B SaaS, startups...", type: "text" },
    ],
    outputLabel: "Your 3 bio options",
    ctaHeading: "Want posts that match your bio?",
    ctaBody: "A great bio sets the expectation. Farcast delivers on it — 9 personalised posts every single day across Twitter, LinkedIn, Reddit and more.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "linkedin-headline-generator",
    title: "LinkedIn Headline Generator",
    tagline: "5 headline options. Stand out in the feed.",
    description: "Enter your role, industry, and one key result. Get 5 LinkedIn headlines that don't sound like everyone else.",
    icon: "in",
    inputs: [
      { name: "role", label: "Your current role", placeholder: "Founder at ..., Head of Growth at ...", type: "text" },
      { name: "industry", label: "Industry / niche", placeholder: "B2B SaaS, fintech, e-commerce...", type: "text" },
      { name: "result", label: "One key result or skill", placeholder: "Grew to $1M ARR, 10 years in product, ex-Google...", type: "text" },
    ],
    outputLabel: "Your 5 headline options",
    ctaHeading: "Now you need content to back it up.",
    ctaBody: "Your headline promises something. Farcast helps you deliver — a full content engine that posts on your behalf every day, personalised to your story.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "reddit-post-title-generator",
    title: "Reddit Post Title Generator",
    tagline: "5 title options. Stop freezing on the blank.",
    description: "Input your niche and post idea. Get 5 Reddit-native title options built for clicks, not cringe.",
    icon: "r/",
    inputs: [
      { name: "niche", label: "Your niche or subreddit type", placeholder: "SaaS founders, e-commerce, solopreneurs, indie hackers...", type: "text" },
      { name: "idea", label: "What your post is about", placeholder: "Lesson I learned about churn, how I got my first 100 users...", type: "textarea" },
    ],
    outputLabel: "Your 5 title options",
    ctaHeading: "Title's easy. Writing the whole post isn't.",
    ctaBody: "Farcast doesn't just write the title — it picks the right subreddit, writes the full post, and queues it daily so you're always in the conversation.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "hook-generator",
    title: "Hook Generator for Founders",
    tagline: "5 opening hooks. Turn your update into attention.",
    description: "Tell us one idea or update. Get 5 opening lines sharp enough to stop the scroll.",
    icon: "✦",
    inputs: [
      {
        name: "update",
        label: "Your idea or update",
        placeholder: "I hit $10k MRR this month, I almost quit last week but..., The one thing that doubled our conversion...",
        type: "textarea",
      },
    ],
    outputLabel: "Your 5 hook options",
    ctaHeading: "The hook is just the first line.",
    ctaBody: "Farcast writes the full post — hook, body, CTA — 9 times a day, every day, tailored to your voice and what you're building.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "thread-outline-generator",
    title: "Thread Outline Generator",
    tagline: "A 7-tweet structure. In 30 seconds.",
    description: "Enter a topic and get a thread outline with tweet-by-tweet placeholders. You write the tweets — or don't.",
    icon: "🧵",
    inputs: [
      {
        name: "topic",
        label: "Thread topic",
        placeholder: "How I validated my SaaS idea in 48 hours, Why most founders fail at content...",
        type: "textarea",
      },
    ],
    outputLabel: "Your 7-tweet thread outline",
    ctaHeading: "The outline is the easy part.",
    ctaBody: "Farcast writes the full thread for you — every tweet, every day, ready to post. Not just an outline, not just once.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "build-in-public-post-generator",
    title: "Build-in-Public Post Generator",
    tagline: "One post from one update. Right now.",
    description: "Tell us one thing that happened this week. Get a complete build-in-public post, ready to copy.",
    icon: "🏗",
    inputs: [
      {
        name: "update",
        label: "One thing that happened this week",
        placeholder: "We hit 50 signups, I had a call with a user who cancelled, the feature I shipped flopped...",
        type: "textarea",
      },
    ],
    outputLabel: "Your post",
    ctaHeading: "One post won't grow your audience.",
    ctaBody: "Farcast gives you 9 posts a day, every day — build-in-public, product updates, lessons learned, hooks — personalised, consistent, done for you.",
    ctaButton: "Get your content engine →",
  },

  // ── ICP & Positioning ──────────────────────────────────────────────────────
  {
    slug: "icp-one-liner-generator",
    title: "ICP One-Liner Generator",
    tagline: "1 sharp ICP sentence + 3 alternatives. Instant.",
    description: "Describe what your product does and get a crisp ICP one-liner — plus 3 alternatives. No more vague 'small businesses' nonsense.",
    icon: "🎯",
    inputs: [
      {
        name: "product",
        label: "What your product does",
        placeholder: "We help B2B SaaS founders track churn reasons so they can fix the right leaks first...",
        type: "textarea",
      },
    ],
    outputLabel: "Primary ICP + 3 alternatives",
    ctaHeading: "ICP alone doesn't get you users.",
    ctaBody: "Farcast builds the full content strategy around your ICP — the psychographics, the buying triggers, the channels, the posts. Daily, personalised, done.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "competitor-differentiator",
    title: "Competitor Differentiator Tool",
    tagline: "Your top 3 differentiators as punchy one-liners.",
    description: "Enter your product and up to 3 competitors. Get 3 sharp differentiators you can actually say out loud — no jargon, no fluff.",
    icon: "vs",
    inputs: [
      {
        name: "product",
        label: "Your product (what it does + who it's for)",
        placeholder: "Farcast: AI content engine that generates 9 posts/day for B2B SaaS founders building in public...",
        type: "textarea",
      },
      {
        name: "competitors",
        label: "1–3 competitors (names or brief descriptions)",
        placeholder: "Buffer (scheduling tool), Taplio (LinkedIn-only), Hypefury (Twitter-focused)...",
        type: "textarea",
      },
    ],
    outputLabel: "Your 3 differentiators",
    ctaHeading: "Knowing your edge is step one.",
    ctaBody: "Farcast posts about your differentiators every day, on the right channels, framed for your ICP — not just a list of bullet points you copy into a deck.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "startup-tagline-generator",
    title: "Startup Tagline Generator",
    tagline: "10 taglines in different styles. Pick the one that fits.",
    description: "Describe your product and get 10 tagline options across different angles — direct, curious, bold, results-led, and more.",
    icon: "✍",
    inputs: [
      {
        name: "product",
        label: "What your product does",
        placeholder: "Farcast generates 9 personalised social posts a day for founders so they never have to write content again...",
        type: "textarea",
      },
    ],
    outputLabel: "Your 10 tagline options",
    ctaHeading: "The tagline is the pitch. You still need the proof.",
    ctaBody: "Farcast builds the content that earns the tagline — 9 posts a day, across every channel, showing exactly what you promised.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "product-hunt-tagline-generator",
    title: "Product Hunt Tagline Generator",
    tagline: "PH-ready tagline under 60 chars + your first comment.",
    description: "Describe your product. Get a Product Hunt tagline (under 60 characters) plus a first-comment draft ready to paste on launch day.",
    icon: "PH",
    inputs: [
      {
        name: "product",
        label: "What your product does (be specific)",
        placeholder: "AI content engine that generates 9 personalised social posts a day for B2B SaaS founders...",
        type: "textarea",
      },
    ],
    outputLabel: "Tagline + first comment draft",
    ctaHeading: "Product Hunt is one day. Farcast is every day.",
    ctaBody: "Your PH launch needs weeks of warm-up content before it, and a consistent posting cadence after. Farcast handles both — automatically, daily.",
    ctaButton: "Get your content engine →",
  },

  // ── Outreach & Leads ───────────────────────────────────────────────────────
  {
    slug: "cold-dm-generator",
    title: "Cold DM Generator",
    tagline: "3 DM templates for Twitter/LinkedIn. Not spammy.",
    description: "Tell us who you're targeting and what you want from them. Get 3 DM templates that open conversations rather than kill them.",
    icon: "DM",
    inputs: [
      {
        name: "target",
        label: "Who you're targeting",
        placeholder: "B2B SaaS founders who are posting on LinkedIn but not getting traction, solo founders building in public...",
        type: "textarea",
      },
      {
        name: "goal",
        label: "What you want from them",
        placeholder: "15-min feedback call, sign up for a free trial, review my landing page, collab on a post...",
        type: "text",
      },
    ],
    outputLabel: "Your 3 DM templates",
    ctaHeading: "3 DMs is a start. Finding them isn't.",
    ctaBody: "Farcast's Chrome extension monitors Twitter and LinkedIn daily, surfaces warm leads automatically, and tells you exactly who to DM and what to say.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "reddit-comment-reply-generator",
    title: "Reddit Comment Reply Generator",
    tagline: "A non-spammy reply that adds value and mentions your product.",
    description: "Paste a Reddit thread or comment plus your product context. Get a reply that genuinely helps first and positions your product second.",
    icon: "↩",
    inputs: [
      {
        name: "thread",
        label: "The Reddit comment or thread you want to reply to",
        placeholder: "Paste the full comment/post text here...",
        type: "textarea",
      },
      {
        name: "product",
        label: "Your product (one sentence)",
        placeholder: "Farcast: AI that generates 9 social posts/day for founders so they never have to write content...",
        type: "textarea",
      },
    ],
    outputLabel: "Your Reddit reply",
    ctaHeading: "One reply, manually. Every day? Impossible.",
    ctaBody: "Farcast monitors Reddit around the clock, surfaces threads where you belong, and drafts the reply — so you're always in the right conversations without spending your day on Reddit.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "warm-lead-qualifier",
    title: "Warm Lead Qualifier",
    tagline: "Paste a tweet or comment. Find out if it's a warm lead.",
    description: "Paste any tweet or Reddit comment. Get a clear yes/no verdict on whether it's a warm lead, why, and exactly what to say.",
    icon: "🔍",
    inputs: [
      {
        name: "content",
        label: "The tweet or Reddit comment",
        placeholder: "Paste the tweet or comment text here...",
        type: "textarea",
      },
      {
        name: "product",
        label: "Your product (one sentence)",
        placeholder: "Farcast: AI that generates 9 social posts/day for founders so they never have to write content...",
        type: "textarea",
      },
    ],
    outputLabel: "Lead assessment",
    ctaHeading: "Qualifying one lead takes 2 minutes. You have hundreds.",
    ctaBody: "Farcast's Chrome extension qualifies leads automatically across the entire web — every tweet, every thread — and tells you who to contact and what to say, daily.",
    ctaButton: "Get your content engine →",
  },

  // ── Launch & Distribution ──────────────────────────────────────────────────
  {
    slug: "product-hunt-launch-checklist",
    title: "Product Hunt Launch Checklist",
    tagline: "Personalised pre-launch checklist. Know what to post and when.",
    description: "Enter your product and launch date. Get a week-by-week checklist of exactly what to post, where, and when — personalised to your product.",
    icon: "☑",
    inputs: [
      {
        name: "product",
        label: "Your product (what it does + who it's for)",
        placeholder: "Farcast: AI content engine for B2B SaaS founders — generates 9 personalised posts/day across Twitter, LinkedIn, Reddit...",
        type: "textarea",
      },
      {
        name: "launch_date",
        label: "When are you launching?",
        placeholder: "In 4 weeks, November 15, next Tuesday...",
        type: "text",
      },
    ],
    outputLabel: "Your pre-launch checklist",
    ctaHeading: "The checklist is the plan. Farcast writes every post on it.",
    ctaBody: "Every item on that checklist requires a post. Farcast generates all of them — the teaser content, the warm-up posts, the launch-day announcements — daily, automatically.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "launch-day-post-planner",
    title: "Launch Day Post Planner",
    tagline: "What to post, where, and in what order on launch day.",
    description: "Enter your product and launch platform. Get a time-ordered plan for launch day — the right format, sequence, and timing for each post.",
    icon: "📅",
    inputs: [
      {
        name: "product",
        label: "Your product (what it does + who it's for)",
        placeholder: "Farcast: AI content engine for B2B SaaS founders — generates 9 personalised posts/day across Twitter, LinkedIn, Reddit...",
        type: "textarea",
      },
      {
        name: "platform",
        label: "Primary launch platform",
        placeholder: "Product Hunt, Hacker News, Reddit (r/SaaS), or multiple...",
        type: "text",
      },
    ],
    outputLabel: "Your launch day plan",
    ctaHeading: "The plan is the easy part. Writing every post is hard.",
    ctaBody: "Every slot in that plan needs content. Farcast writes all of it — the announcement thread, the personal story post, the comment responses, the follow-up — done.",
    ctaButton: "Get your content engine →",
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  {
    slug: "subreddit-finder",
    title: "Subreddit Finder for Founders",
    tagline: "8 subreddits where your ICP actually hangs out.",
    description: "Describe your ICP in two lines. Get 8 relevant subreddits — what kind of posts work there, what gets you banned, and what format to use.",
    icon: "r/",
    inputs: [
      {
        name: "icp",
        label: "Your ICP in 2 lines",
        placeholder: "B2B SaaS founders at pre-seed stage, 1-5 person teams, struggling with distribution and content consistency...",
        type: "textarea",
      },
    ],
    outputLabel: "Your 8 subreddits",
    ctaHeading: "Finding the subreddits is 5% of the work.",
    ctaBody: "Farcast monitors those communities daily, drafts posts that fit each subreddit's culture, and queues them — so you're always in the conversation without living on Reddit.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "founder-about-me-generator",
    title: "Founder About Me Generator",
    tagline: "3 tones: humble, authoritative, personal. Pick one.",
    description: "Enter your name, product, and background. Get a short founder story in 3 distinct tones — for your site, PH profile, or investor intro.",
    icon: "👤",
    inputs: [
      { name: "name", label: "Your name", placeholder: "Alex Chen", type: "text" },
      {
        name: "product",
        label: "Your product (one sentence)",
        placeholder: "Farcast: AI content engine that generates 9 posts/day for B2B SaaS founders...",
        type: "textarea",
      },
      {
        name: "background",
        label: "Relevant background",
        placeholder: "Ex-Google PM, 2 failed startups before this one, 5 years in B2B sales, self-taught developer...",
        type: "textarea",
      },
    ],
    outputLabel: "3 About Me versions",
    ctaHeading: "The bio introduces you. Content is how people get to know you.",
    ctaBody: "Farcast builds the content strategy that backs up your bio — 9 posts a day, across every channel, showing exactly the person your About Me promises.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "gtm-priority-ranker",
    title: "GTM Priority Ranker",
    tagline: "5 channels ranked for your stage. With a reason for each.",
    description: "Describe your product and current stage. Get a ranked list of 5 channels to focus on right now — with a one-line reason tied to your specific situation.",
    icon: "📊",
    inputs: [
      {
        name: "product",
        label: "Your product (what it does + who it's for)",
        placeholder: "Farcast: AI content engine for B2B SaaS founders — generates 9 posts/day across Twitter, LinkedIn, Reddit...",
        type: "textarea",
      },
      {
        name: "stage",
        label: "Your current stage",
        placeholder: "Pre-launch with 50 waitlist signups, just launched with 10 paying users, $5k MRR trying to get to $20k...",
        type: "textarea",
      },
    ],
    outputLabel: "Your 5 ranked channels",
    ctaHeading: "Ranking channels is easy. Executing on all 5 isn't.",
    ctaBody: "Farcast gives you the full channel playbook — not just a ranked list. What to post, how often, in what format, for each channel, every day.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "waitlist-email-sequence-generator",
    title: "Waitlist Email Sequence Generator",
    tagline: "3-email welcome sequence. Day 0, Day 3, Day 7.",
    description: "Enter your product and what it does. Get a complete 3-email waitlist sequence with subject lines — ready to drop into your email tool.",
    icon: "📧",
    inputs: [
      {
        name: "product",
        label: "Your product name",
        placeholder: "Farcast",
        type: "text",
      },
      {
        name: "description",
        label: "What it does + who it's for",
        placeholder: "AI content engine that generates 9 personalised social posts a day for B2B SaaS founders so they never have to write content again...",
        type: "textarea",
      },
    ],
    outputLabel: "Your 3-email sequence",
    ctaHeading: "Emails keep them warm. Content makes them want in.",
    ctaBody: "Farcast generates the social content that runs alongside your waitlist — the build-in-public posts, the launch teasers, the behind-the-scenes — turning strangers into subscribers before you even launch.",
    ctaButton: "Get your content engine →",
  },
  {
    slug: "viral-post-analyser",
    title: "Viral Post Analyser",
    tagline: "Paste any viral post. Understand exactly why it worked.",
    description: "Paste a viral founder post. Get a breakdown of the hook type, structure, emotional trigger, reach tier, and the one insight you should steal.",
    icon: "🔬",
    inputs: [
      {
        name: "post",
        label: "Paste the viral post",
        placeholder: "Paste the full text of the post here...",
        type: "textarea",
      },
    ],
    outputLabel: "Post breakdown",
    ctaHeading: "Knowing what good looks like is the start.",
    ctaBody: "Farcast doesn't just show you what works — it generates posts that use those same patterns, daily, tailored to your voice and your build. Study one post or get 9 of them every day.",
    ctaButton: "Get your content engine →",
  },
];

export function getToolBySlug(slug: string): ToolConfig | undefined {
  return FREE_TOOLS.find((t) => t.slug === slug);
}
