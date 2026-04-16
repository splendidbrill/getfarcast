import { NextResponse, type NextRequest } from "next/server";

import {
  buildExtensionConfigResponse,
  getAuthenticatedExtensionUser,
  getExtensionCorsHeaders,
} from "@/lib/extension/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getExtensionCorsHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedExtensionUser(request);

  if (!user) {
    return NextResponse.json(
      { error: error ?? "Unauthorized" },
      {
        status: 401,
        headers: getExtensionCorsHeaders(),
      }
    );
  }

  const [{ data: extensionConfig, error: configError }, { data: playbooks, error: playbooksError }] =
    await Promise.all([
      supabase
        .from("extension_configs")
        .select("connected_handles, selectors, last_synced_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("playbooks")
        .select("id, product_name, data, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  if (configError || playbooksError) {
    return NextResponse.json(
      {
        error:
          configError?.message ||
          playbooksError?.message ||
          "Failed to load extension config",
      },
      {
        status: 500,
        headers: getExtensionCorsHeaders(),
      }
    );
  }

  return NextResponse.json(
    buildExtensionConfigResponse({
      userId: user.id,
      config: extensionConfig,
      playbooks,
    }),
    {
      status: 200,
      headers: getExtensionCorsHeaders(),
    }
  );
}