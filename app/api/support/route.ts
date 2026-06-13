import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function sanitize(value: unknown) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nome = sanitize(body.nome);
    const email = sanitize(body.email);
    const telefone = sanitize(body.telefone);
    const mensagem = sanitize(body.mensagem);

    if (!nome || !email || !telefone || !mensagem) {
      return NextResponse.json(
        { error: "Preencha nome, e-mail, telefone e mensagem." },
        { status: 400 },
      );
    }

    if (mensagem.length > 5000) {
      return NextResponse.json(
        { error: "A mensagem está muito longa. Envie até 5.000 caracteres." },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.from("support_requests").insert({
      name: nome,
      email,
      phone: telefone,
      message: mensagem,
      status: "open",
      source: "portal",
    });

    if (error) {
      console.error("Erro ao salvar suporte:", error.message);
      return NextResponse.json(
        { error: "Não foi possível registrar sua solicitação agora." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Erro inesperado no suporte:", error?.message || error);
    return NextResponse.json(
      { error: "Erro inesperado ao enviar suporte." },
      { status: 500 },
    );
  }
}
