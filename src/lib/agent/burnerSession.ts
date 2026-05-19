import { createClient as createAdminClient } from "@supabase/supabase-js";

export interface BurnerCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  expires?: number;
}

export interface BurnerSession {
  id: string;
  platform: "linkedin" | "twitter_x";
  cookies: BurnerCookie[];
  user_agent: string | null;
}

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getBurnerSession(
  platform: "linkedin" | "twitter_x"
): Promise<BurnerSession | null> {
  const { data, error } = await admin()
    .from("burner_sessions")
    .select("id, platform, cookies, user_agent")
    .eq("platform", platform)
    .eq("is_active", true)
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .single();

  if (error || !data) return null;

  await admin()
    .from("burner_sessions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data as BurnerSession;
}

export async function markBurnerBanned(id: string): Promise<void> {
  await admin()
    .from("burner_sessions")
    .update({ is_active: false, banned_at: new Date().toISOString() })
    .eq("id", id);
}

export function isPaidUser(subscriptionStatus: string | null | undefined): boolean {
  return subscriptionStatus === "active" || subscriptionStatus === "on_trial";
}
