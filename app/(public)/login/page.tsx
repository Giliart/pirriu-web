"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/Logo";
import { StoreBadge } from "@/components/StoreBadge";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function login() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/painel");
  }

  async function resetPassword() {
    if (!email) {
      setMessage("Digite seu e-mail para recuperar a senha.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/seguranca`,
    });

    setMessage(error ? error.message : "Enviamos um link de redefinição para seu e-mail.");
  }

  return (
    <main className="pw-login-page">
      <section className="pw-login-left">
        <div className="pw-login-card">
          <div className="pw-login-logo">
            <Logo large text={false} />
          </div>

          <h1 className="pw-login-title">Acesse sua conta</h1>
          <p className="pw-login-text">Entre com seu e-mail e senha para continuar.</p>

          <div className="pw-form">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pw-input"
              placeholder="E-mail"
              type="email"
              autoComplete="email"
            />

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pw-input"
              placeholder="Senha"
              type="password"
              autoComplete="current-password"
            />

            <button onClick={resetPassword} className="pw-link-button" type="button">
              Esqueceu sua senha?
            </button>

            <button onClick={login} disabled={loading} className="pw-primary-btn" type="button">
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {message && <p className="pw-alert">{message}</p>}
          </div>
        </div>
      </section>

      <section className="pw-login-right">
        <div className="pw-login-copy">
          <Logo large text={false} />

          <h2>Portal web complementar do PIRRIU.</h2>
          <p>
            Veja assinatura, resumo da conta, pagamentos e links de download. As funções principais continuam no aplicativo.
          </p>

          <div className="pw-store-row" style={{ marginTop: 30 }}>
            <StoreBadge store="App Store" />
            <StoreBadge store="Google Play" />
          </div>
        </div>
      </section>
    </main>
  );
}
