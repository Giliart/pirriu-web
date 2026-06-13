"use client";

import { FormEvent, useState } from "react";
import { Header } from "@/components/Header";
import { Headphones, Mail, MessageSquare } from "lucide-react";

type Status = {
  type: "ok" | "error";
  message: string;
} | null;

export default function SuportePage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    mensagem: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!form.nome.trim() || !form.email.trim() || !form.telefone.trim() || !form.mensagem.trim()) {
      setStatus({ type: "error", message: "Preencha nome, e-mail, telefone e mensagem." });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível enviar sua solicitação.");
      }

      setStatus({ type: "ok", message: "Solicitação enviada com sucesso. Em breve entraremos em contato." });
      setForm({ nome: "", email: "", telefone: "", mensagem: "" });
    } catch (error: any) {
      setStatus({ type: "error", message: error?.message || "Erro ao enviar suporte." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pw-page">
      <Header />

      <main className="pw-legal-main">
        <div className="pw-container">
          <section className="pw-legal-hero">
            <p className="pw-legal-kicker">Atendimento PIRRIU</p>
            <h1 className="pw-legal-title">Suporte</h1>
            <p className="pw-legal-subtitle">
              Envie uma mensagem explicando o que está acontecendo. Informe dados de contato para que a equipe consiga retornar.
            </p>
          </section>

          <div className="pw-legal-grid">
            <section className="pw-legal-card">
              <h2><Headphones size={22} /> Abrir solicitação</h2>
              <p>
                Use este formulário para dúvidas sobre login, plano, cobrança, app, portal, clientes, rondas, recibos ou problemas técnicos.
              </p>

              <form className="pw-support-form" onSubmit={handleSubmit}>
                <div className="pw-support-row">
                  <div className="pw-support-field">
                    <label>Nome</label>
                    <input
                      value={form.nome}
                      onChange={(event) => updateField("nome", event.target.value)}
                      placeholder="Digite seu nome"
                    />
                  </div>

                  <div className="pw-support-field">
                    <label>E-mail</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="seuemail@exemplo.com"
                    />
                  </div>
                </div>

                <div className="pw-support-field">
                  <label>Telefone</label>
                  <input
                    value={form.telefone}
                    onChange={(event) => updateField("telefone", event.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="pw-support-field">
                  <label>Mensagem</label>
                  <textarea
                    value={form.mensagem}
                    onChange={(event) => updateField("mensagem", event.target.value)}
                    placeholder="Descreva o que está acontecendo..."
                  />
                </div>

                {status && (
                  <div className={`pw-support-status ${status.type}`}>
                    {status.message}
                  </div>
                )}

                <button className="pw-support-button" type="submit" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar solicitação"}
                </button>
              </form>
            </section>

            <section className="pw-legal-card">
              <h2><MessageSquare size={22} /> O que informar</h2>
              <ul>
                <li>Seu ID de conta PIRRIU, se estiver logado no aplicativo.</li>
                <li>Qual tela apresentou o problema.</li>
                <li>Se aconteceu no aplicativo ou no portal web.</li>
                <li>Mensagem de erro, print ou descrição do que ocorreu.</li>
              </ul>

              <h3><Mail size={18} /> Retorno</h3>
              <p>
                O suporte será analisado com base nas informações enviadas. Quanto mais detalhes você informar, mais rápido será o diagnóstico.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="pw-footer">
        PIRRIU © 2026
        <span className="pw-footer-links">
          <a href="/privacidade">Privacidade</a>
          <a href="/termos">Termos</a>
        </span>
      </footer>
    </div>
  );
}
