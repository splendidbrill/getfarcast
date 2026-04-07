export interface PlatformChannelDNA {
  platform_type: string;
  algorithm_type: string;
  primary_audience: string;
  native_content_formats: string;
  platform_culture_code: string;
  account_warmup_requirements: string;
}

export interface PlatformFitScoringMatrix {
  best_product_types: string;
  worst_product_types: string;
  best_pricing_models: string;
  icp_match_signals: string;
  red_flags_skip_this_channel: string;
  geographic_strength: string;
}

export interface PlatformGrowthMechanics {
  expected_cac: string;
  time_to_first_traffic_spike: string;
  time_to_first_paying_user: string;
  effort_level: string;
  virality_coefficient: string;
  compounding_potential: string;
}

export interface PlatformAlgorithmPlaybook {
  how_reach_is_determined: string;
  what_algorithm_rewards: string;
  what_kills_reach: string;
  peak_posting_windows: string;
  optimal_posting_cadence: string;
  content_freshness_window: string;
}

export interface PlatformContentSystem {
  winning_content_types: string;
  hook_formulas: string;
  platform_native_tone: string;
  cta_approach: string;
  content_to_avoid: string;
  cross_posting_rules: string;
}

export interface PlatformCommunityOutreachPlaybook {
  where_icp_clusters: string;
  contribution_before_pitch_rule: string;
  dm_outreach_approach: string;
  influencer_partner_strategy: string;
  broadcast_vs_community_mode: string;
  banned_behaviours: string;
}

export interface PlatformBusinessStagePlaybook {
  pre_launch_0_users: string;
  early_traction_1_to_100: string;
  growth_100_to_1k: string;
  scale_1k_plus: string;
}

export interface PlatformProofOfPlay {
  early_stage_win: string;
  growth_stage_win: string;
  what_made_it_work: string;
  what_would_have_killed_it: string;
}

export interface Platform {
  channel: string;
  tier: number;
  channel_dna: PlatformChannelDNA;
  fit_scoring_matrix: PlatformFitScoringMatrix;
  growth_mechanics: PlatformGrowthMechanics;
  algorithm_playbook: PlatformAlgorithmPlaybook;
  content_system: PlatformContentSystem;
  community_outreach_playbook: PlatformCommunityOutreachPlaybook;
  business_stage_playbook: PlatformBusinessStagePlaybook;
  proof_of_play: PlatformProofOfPlay;
}