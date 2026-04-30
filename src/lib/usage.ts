import { createClient as createAdminClient } from "@supabase/supabase-js";

export type UsageType = "playbooks" | "content_generations" | "replies" | "dms" | "leads";

export const USAGE_LIMITS: Record<UsageType, number> = {
  playbooks: 10,
  content_generations: 150, // 30 days * 5 regenerations
  replies: 2000,
  dms: 2000,
  leads: 900 // 30 per day
};

export async function checkAndIncrementUsage(
  userId: string, 
  type: UsageType, 
  amount: number = 1
): Promise<{ allowed: boolean, error?: string }> {
  // Use admin client to bypass RLS for usage tracking
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  try {
    // 1. Fetch current usage
    const { data, error } = await admin
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("month_year", monthYear)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("[Usage Tracking] Error fetching usage:", error);
      // Fail open or fail closed? Fail closed is safer for limits, but fail open is better for UX if DB is slow.
      // We'll fail open if it's an unexpected DB error to avoid breaking the app.
      return { allowed: true };
    }
    
    let currentCount = 0;
    if (data) {
      currentCount = data[type] || 0;
    }
    
    // 2. Check limits
    if (currentCount + amount > USAGE_LIMITS[type]) {
      return { 
        allowed: false, 
        error: `You have reached your monthly limit for ${type} (${USAGE_LIMITS[type]}). Please upgrade your plan or wait until next month.` 
      };
    }
    
    // 3. Increment usage
    if (data) {
      await admin
        .from("user_usage")
        .update({ [type]: currentCount + amount, updated_at: new Date().toISOString() })
        .eq("id", data.id);
    } else {
      const insertData = { 
        user_id: userId, 
        month_year: monthYear, 
        [type]: amount 
      };
      await admin.from("user_usage").insert(insertData);
    }
    
    return { allowed: true };
  } catch (err) {
    console.error("[Usage Tracking] Unexpected error:", err);
    return { allowed: true }; // Fail open
  }
}
