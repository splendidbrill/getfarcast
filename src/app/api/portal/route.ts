import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Redirects to the Whop customer hub where users can manage/cancel their membership
export async function GET() {
  return NextResponse.redirect("https://whop.com/hub/");
}
