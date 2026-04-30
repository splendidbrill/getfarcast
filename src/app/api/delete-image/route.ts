import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/blogAuth";
import { deleteImageFromS3 } from "@/lib/s3";

export async function DELETE(request: Request) {
  const uid = await getSessionUser();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { src } = await request.json();
  if (!src) return NextResponse.json({ error: "src required" }, { status: 400 });

  await deleteImageFromS3(src);

  return NextResponse.json({ ok: true });
}
