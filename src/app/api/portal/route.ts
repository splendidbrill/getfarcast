import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = process.env.PAYMENT_PROVIDER ?? "whop";
  const portalUrl =
    provider === "polar"
      ? (process.env.POLAR_PORTAL_URL ?? "https://polar.sh/getfarcast")
      : "https://whop.com/hub/";
  return NextResponse.redirect(portalUrl);
}
