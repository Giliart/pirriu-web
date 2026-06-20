import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ChevronRight, CreditCard, MapPinned, ReceiptText, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { SecureImage } from "@/components/SecureImage";
import { createClient } from "@/lib/supabase-server";
import { moneyBRL } from "@/lib/format";
import { getPortalOverview, initialsFromName, getSubscriptionStatusLabel } from "@/lib/portal-data";

function statusLabel(status?: string | null) {
  const value = String(status || "active").toLowerCase();
  if (value === "active") return "Ativa";
  if (value === "cancelled" || value === "canceled") return "Cancelada";
  if (value === "pending") return "Pendente";
  if (value === "overdue") return "Em atraso";
  return status || "Ativa";
}

export default async function PainelPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");

  const { profile, account, plan, avatarUrl, stats } = await getPortalOverview(auth.user.id);
  const firstName = profile?.full_name?.split(" ")?.[0] || auth.user.email?.split("@")[0] || "usuário";
  const clientLimit = plan?.max_active_clients || account?.max_active_clients_override || "-";
  const roundLimit = plan?.max_rounds || account?.max_rounds_override || "-";

  const cards = [
    ["Clientes ativos", String(stats.activeClients), `Limite: ${clientLimit}`, Users, "blue"],
    ["Atrasados", String(stats.lateClients), "Exigem atenção", Bell, "red"],
    ["Pendentes", String(stats.pendingClients), "Aguardando pagamento", CreditCard, "gold"],
    ["Previsão mensal", moneyBRL(stats.monthlyTotal), "Clientes ativos", ReceiptText, "green"],
  ] as const;

  return (
    <div className="pw-page pw-page-premium">
      <Header logged avatarUrl={avatarUrl} userName={profile?.full_name || account?.name} />

      <main className="pw-dashboard pw-modern-page">
        <div className="pw-container">
          <section className="pw-dashboard-hero">
            <div className="pw-profile-line">
              {avatarUrl ? (
                <SecureImage src={avatarUrl} className="pw-profile-avatar" alt="Foto de perfil" />
              ) : (
                <div className="pw-profile-avatar pw-profile-avatar--fallback">{initialsFromName(profile?.full_name)}</div>
              )}

              <div>
                <p className="pw-kicker">Bem-vindo ao PIRRIU</p>
                <h1>Olá, {firstName}</h1>
                <p className="pw-welcome-sub">Conta {account?.account_code || "-"} · Plano {plan?.name || "Basic"}</p>
              </div>
            </div>

            <div className="pw-hero-badges">
              <span className="pw-pill pw-pill-yellow">{plan?.name || "Basic"}</span>
              <span className="pw-pill pw-pill-soft">{statusLabel(account?.subscription_status)}</span>
            </div>
          </section>

          <section className="pw-stats-grid pw-stats-grid--premium">
            {cards.map(([label, value, sub, Icon, tone]) => (
              <article key={label} className={`pw-card pw-metric-card pw-metric-card--${tone}`}>
                <div className="pw-card-icon"><Icon size={28} /></div>
                <h3>{label}</h3>
                <p className="pw-card-value">{value}</p>
                <p className="pw-card-sub">{sub}</p>
              </article>
            ))}
          </section>

          <section className="pw-info-grid pw-info-grid--premium">
            <article className="pw-card pw-action-panel">
              <div>
                <p className="pw-kicker">Operação</p>
                <h2 className="pw-section-title">Resumo rápido</h2>
                <p className="pw-card-sub">Acompanhe os indicadores do portal e continue a operação completa pelo aplicativo.</p>
              </div>

              <div className="pw-action-list">
                <Link href="/resumo"><TrendingUp size={20} /> Ver resumo completo <ChevronRight size={18} /></Link>
                <Link href="/assinatura"><ShieldCheck size={20} /> Gerenciar assinatura <ChevronRight size={18} /></Link>
                <Link href="/resumo"><MapPinned size={20} /> Dados da conta <ChevronRight size={18} /></Link>
              </div>
            </article>

            <article className="pw-card pw-profile-card-modern">
              <p className="pw-kicker">Perfil</p>
              <h2 className="pw-section-title">Dados principais</h2>
              <div className="pw-detail-list pw-detail-list--modern">
                <p><span>Nome</span><strong>{profile?.full_name || "-"}</strong></p>
                <p><span>E-mail</span><strong>{profile?.email || auth.user.email}</strong></p>
                <p><span>Telefone</span><strong>{profile?.phone || "-"}</strong></p>
                <p><span>Rondas</span><strong>{stats.activeRounds} / {roundLimit}</strong></p>
              </div>
            </article>
          </section>
        </div>
      </main>

      <footer className="pw-footer">PIRRIU © 2026 — Portal complementar do aplicativo.</footer>
    </div>
  );
}
