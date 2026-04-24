export type Platform = 'twitter_x' | 'reddit' | 'linkedin';

export type ConnectedHandles = {
    twitter?: string;
    reddit?: string;
    linkedin?: string;
};

export type ActivePlaybook = {
    playbook_id: string;
    product_name: string;
    recommended_subreddits: string[];
    intent_keywords: string[];
    icp_summary: string;
};

export type PlatformSelectorConfig = {
    page?: Record<string, string>;
    performance?: Record<string, string>;
    engagers?: Record<string, string>;
    intent?: Record<string, string>;
};

export type ExtensionConfig = {
    farcastUserId?: string;
    connectedHandles: ConnectedHandles;
    activePlaybooks: ActivePlaybook[];
    selectors: Partial<Record<Platform, PlatformSelectorConfig>>;
    syncedAt: string;
};

export type ContentPerformancePayload = {
    user_id: string;
    playbook_id: string;
    platform: Platform;
    post_id: string;
    content_preview: string;
    metrics: {
        likes_or_upvotes?: number;
        replies_or_comments?: number;
        shares_or_retweets?: number;
        bookmarks?: number;
        impressions?: number;
        upvote_ratio?: number;
    };
    captured_at: string;
};

export type LeadPayload = {
    username_or_name: string;
    bio_or_headline?: string;
    profile_url: string;
    engagement_type?: string;
    engagement_weight?: number;
    comment_preview?: string;
    matched_text_preview?: string;
    matched_keyword?: string;
    source_url?: string;
    posted_at?: string;
};

export type EngagerLeadsPayload = {
    user_id: string;
    playbook_id: string;
    platform: Platform;
    source_post_id: string;
    leads: LeadPayload[];
};

export type IntentLeadsPayload = {
    user_id: string;
    playbook_id: string;
    platform: Platform;
    leads: LeadPayload[];
};

export type PageContextPayload = {
    platform: Platform;
    url: string;
    title: string;
    observedAt: string;
};

export type IntentMatch = {
    keyword: string;
    matchedText: string;
};

export type ScanContext = {
    platform: Platform;
    url: string;
    selectors?: PlatformSelectorConfig;
    config: ExtensionConfig;
};
