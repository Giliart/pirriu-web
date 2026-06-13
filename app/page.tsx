import { Bell, CreditCard, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";
import { StoreBadge } from "@/components/StoreBadge";

export default function HomePage() {
  return (
    <div className="pw-page">
      <Header />

      <main>
        <section className="pw-hero">
          <div className="pw-container pw-hero-grid">
            <div>
              <div className="pw-brand-row">
                <Logo large text={false} />
                <div>
                  <h1 className="pw-title">PIRRIU</h1>
                  <p className="pw-subtitle">
                    Gestão completa para vigilância: clientes, rondas, cobranças, recibos e indicadores em um ecossistema simples e seguro.
                  </p>
                </div>
              </div>

              <div className="pw-feature-list">
                <div className="pw-feature"><Users size={24} /> Gerencie clientes e contratos</div>
                <div className="pw-feature"><ShieldCheck size={24} /> Controle rondas e ocorrências</div>
                <div className="pw-feature"><CreditCard size={24} /> Emita cobranças e recibos</div>
                <div className="pw-feature"><ReceiptText size={24} /> Acompanhe relatórios e indicadores</div>
              </div>

              <div>
                <div className="pw-download-title">Baixe o app</div>
                <div className="pw-store-row">
                  <StoreBadge store="App Store" />
                  <StoreBadge store="Google Play" />
                </div>
              </div>
            </div>

            <div className="pw-phone-wrap">
              <div className="pw-phone">
                <div className="pw-notch" />
                <div className="pw-phone-screen">
                  <div className="pw-phone-top">
                    <img src="/login-hero.png" alt="Logo PIRRIU" className="pw-phone-logo" />
                    <Bell />
                  </div>

                  <p className="pw-phone-muted">Olá, vigilante! 👋</p>
                  <h3 className="pw-phone-title">Resumo do seu painel</h3>

                  <div className="pw-phone-highlight">
                    <p className="pw-phone-label">Clientes ativos</p>
                    <p className="pw-phone-big">128 / 400</p>
                    <p className="pw-phone-note">Limite do seu plano</p>
                  </div>

                  <div className="pw-phone-mini-grid">
                    <div className="pw-phone-card">
                      <p>Rondas hoje</p>
                      <strong>24</strong>
                    </div>
                    <div className="pw-phone-card">
                      <p>Ocorrências</p>
                      <strong>3</strong>
                    </div>
                  </div>

                  <div className="pw-phone-card" style={{ marginTop: 13 }}>
                    <p>Recebimentos do mês</p>
                    <strong>R$ 3.450,00</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="pw-footer">
        PIRRIU © 2026 — Portal complementar do aplicativo.
        <span className="pw-footer-links">
          <a href="/privacidade">Privacidade</a>
          <a href="/termos">Termos</a>
          <a href="/suporte">Suporte</a>
        </span>
      </footer>
    </div>
  );
}
