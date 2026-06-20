import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function isSafeHttpUrl(value?: string | null) {
  return Boolean(value && /^https:\/\/[^/]+/i.test(value));
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { profileId } = await context.params;
  const requestedProfileId = profileId;

  const { data: viewer } = await supabaseAdmin
    .from("profiles")
    .select("id, account_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, account_id, avatar_url")
    .eq("id", requestedProfileId)
    .maybeSingle();

  if (!viewer || !profile || viewer.account_id !== profile.account_id) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isSafeHttpUrl(profile.avatar_url)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const imageResponse = await fetch(profile.avatar_url, {
    cache: "no-store",
  });

  if (!imageResponse.ok || !imageResponse.body) {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

  return new NextResponse(imageResponse.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline; filename=\"avatar\"",
    },
  });
}
