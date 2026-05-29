"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Header } from "@/components/Header";

export default function SegurancaPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function updatePassword() {
    if (password.length < 6) {
      setMessage("Digite uma senha com pelo menos 6 caracteres.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Senha alterada com sucesso.");
  }

  return (
    <div className="pw-page">
      <Header logged />

      <main className="pw-security-page">
        <div className="pw-container">
          <section className="pw-security-card">
            <p className="pw-kicker">Segurança</p>
            <h1 className="pw-section-title">Alterar senha</h1>
            <p className="pw-card-sub">Digite a nova senha da sua conta PIRRIU.</p>

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="pw-input"
              placeholder="Nova senha"
            />

            <button onClick={updatePassword} className="pw-primary-btn" style={{ width: "100%", marginTop: 16 }}>
              Salvar nova senha
            </button>

            {message && <p className="pw-message">{message}</p>}
          </section>
        </div>
      </main>

      <footer className="pw-footer">PIRRIU © 2026 — Portal complementar do aplicativo.</footer>
    </div>
  );
}
