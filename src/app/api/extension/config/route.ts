import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
    buildExtensionConfigResponse,
    getAuthenticatedExtensionUser,
    getExtensionCorsHeaders,
} from "@/lib/extension/server";

export const dynamic = "force-dynamic";

const cors = getExtensionCorsHeaders();

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(request: NextRequest) {
    const { user, error } = await getAuthenticatedExtensionUser(request);

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: playbooks } = await admin
        .from("playbooks")
        .select("id, product_name, data")
        .eq("user_id", user.id);

    return NextResponse.json(
        buildExtensionConfigResponse({ userId: user.id, config: null, playbooks }),
        { headers: cors }
    );
}
