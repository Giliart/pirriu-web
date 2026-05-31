"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/Logo";
import { StoreBadge } from "@/components/StoreBadge";

function translateAuthError(message?: string) {
  const value = (message || "").toLowerCase();
  if (value.includes("invalid login") || value.includes("invalid credentials")) return "E-mail ou senha inválidos.";
  if (value.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (value.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (value.includes("signup") || value.includes("not found")) return "Conta não encontrada. Verifique o e-mail informado.";
  return "Não foi possível concluir a ação. Verifique os dados e tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function login() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setMessage(translateAuthError(error.message));
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
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/api/auth/callback?next=/nova-senha&type=recovery`,
    });

    setMessage(error ? translateAuthError(error.message) : "Enviamos um link de redefinição para seu e-mail.");
  }

  return (
    <main className="pw-login-page pw-login-page--premium">
      <section className="pw-login-left">
        <div className="pw-login-card pw-glass-card">
          <div className="pw-login-logo">
            <Logo large text={false} />
          </div>

          <p className="pw-kicker">Portal Web</p>
          <h1 className="pw-login-title">Acesse sua conta</h1>
          <p className="pw-login-text">Entre para acompanhar assinatura, resumo e dados principais do PIRRIU.</p>

          <div className="pw-form">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pw-input"
              placeholder="E-mail"
              type="email"
              autoComplete="email"
            />

            <label className="pw-password-wrap">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pw-input pw-input--with-eye"
                placeholder="Senha"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
              />
              <button type="button" className="pw-eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar ou ocultar senha">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </label>

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
        <div className="pw-login-copy pw-login-copy--modern">
          <Logo large text={false} />

          <h2>Portal complementar do PIRRIU.</h2>
          <p>
            Acompanhe assinatura, resumo da conta, pagamentos e links de download em uma experiência premium. As funções operacionais continuam no aplicativo.
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
