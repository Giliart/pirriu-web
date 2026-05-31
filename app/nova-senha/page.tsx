"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/Logo";

function translateError(message?: string) {
  const value = (message || "").toLowerCase();
  if (value.includes("same password")) return "A nova senha precisa ser diferente da senha atual.";
  if (value.includes("weak") || value.includes("short")) return "Use uma senha mais forte.";
  if (value.includes("session") || value.includes("auth")) return "Seu link expirou. Solicite uma nova redefinição de senha.";
  return "Não foi possível alterar a senha. Tente novamente.";
}

export default function NovaSenhaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function updatePassword() {
    setSuccess(false);
    setMessage("");

    if (password.length < 6) {
      setMessage("Digite uma senha com pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não conferem. Digite a mesma senha nos dois campos.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(translateError(error.message));
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccess(true);
    setMessage("Senha alterada com sucesso. Você já pode entrar com a nova senha.");

    setTimeout(() => router.push("/login"), 1600);
  }

  return (
    <main className="pw-reset-page">
      <section className="pw-reset-shell">
        <div className="pw-reset-brand">
          <Logo large text={false} />
          <div>
            <span>PIRRIU</span>
            <strong>Redefinição de senha</strong>
          </div>
        </div>

        <div className="pw-security-card pw-glass-card pw-reset-card">
          <div className="pw-security-icon"><LockKeyhole size={34} /></div>
          <p className="pw-kicker">Acesso seguro</p>
          <h1 className="pw-section-title">Crie sua nova senha</h1>
          <p className="pw-card-sub">Digite e confirme a nova senha da sua conta PIRRIU.</p>

          <label className="pw-password-wrap">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              className="pw-input pw-input--with-eye"
              placeholder="Nova senha"
              autoComplete="new-password"
            />
            <button type="button" className="pw-eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar ou ocultar nova senha">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </label>

          <label className="pw-password-wrap">
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showConfirmPassword ? "text" : "password"}
              className="pw-input pw-input--with-eye"
              placeholder="Confirmar nova senha"
              autoComplete="new-password"
            />
            <button type="button" className="pw-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Mostrar ou ocultar confirmação de senha">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </label>

          <button onClick={updatePassword} disabled={loading} className="pw-primary-btn" style={{ width: "100%", marginTop: 16 }}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>

          {message && <p className={success ? "pw-message pw-message--success" : "pw-message"}>{message}</p>}
        </div>

        <aside className="pw-reset-side">
          <ShieldCheck size={34} />
          <strong>Link de recuperação confirmado</strong>
          <p>Após salvar, você será direcionado para o login e poderá acessar normalmente.</p>
        </aside>
      </section>
    </main>
  );
}
