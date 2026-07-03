import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function sanitizeText(value: unknown, fallback: string, maxLength = 160) {
  const text = String(value || "").trim();
  return (text || fallback).slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Usuário não autenticado." }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !userData.user?.id) {
      return NextResponse.json({ ok: false, error: "Sessão inválida. Faça login novamente." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = sanitizeText(body.title, "PIRRIU - Push remoto", 80);
    const message = sanitizeText(body.body, "Notificação remota enviada pelo servidor do PIRRIU.", 180);
    const channelId = sanitizeText(body.channelId, "pirriu-default", 60);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("expo_push_token")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao buscar profile para push:", profileError.message);
      return NextResponse.json({ ok: false, error: "Não foi possível buscar o perfil." }, { status: 500 });
    }

    const token = String(profile?.expo_push_token || "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "Nenhum Expo Push Token salvo no perfil." }, { status: 400 });
    }

    if (!/^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(token)) {
      return NextResponse.json({ ok: false, error: "Token push inválido no perfil." }, { status: 400 });
    }

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title,
        body: message,
        sound: "default",
        channelId,
        data: {
          source: "pirriu-test",
          screen: "Perfil",
        },
      }),
    });

    const expoPayload = await expoResponse.json().catch(() => null);

    if (!expoResponse.ok) {
      console.error("Expo Push API falhou:", expoPayload);
      return NextResponse.json(
        { ok: false, error: "Expo Push API recusou o envio.", details: expoPayload },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, ticket: expoPayload });
  } catch (error: any) {
    console.error("Erro inesperado no push de teste:", error?.message || error);
    return NextResponse.json({ ok: false, error: "Erro inesperado ao enviar push remoto." }, { status: 500 });
  }
}
