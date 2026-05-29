import { redirect } from "next/navigation";
import { Bell, ChevronRight, CreditCard, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase-server";
import { moneyBRL } from "@/lib/format";
import { getPortalOverview, initialsFromName } from "@/lib/portal-data";

export default async function PainelPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");

  const { profile, account, plan, avatarUrl, stats } = await getPortalOverview(auth.user.id);
  const firstName = profile?.full_name?.split(" ")?.[0] || auth.user.email?.split("@")[0] || "usuário";

  const cards = [
    ["Clientes ativos", String(stats.activeClients), `Limite: ${plan?.max_active_clients || "-"}`, Users],
    ["Atrasados", String(stats.lateClients), "Exigem atenção", Bell],
    ["Pendentes", String(stats.pendingClients), "Aguardando pagamento", CreditCard],
    ["Previsão mensal", moneyBRL(stats.monthlyTotal), "Clientes ativos", ReceiptText],
  ] as const;

  return (
    <div className="pw-page">
      <Header logged avatarUrl={avatarUrl} userName={account?.name} />

      <main className="pw-dashboard">
        <div className="pw-container">
          <section className="pw-welcome">
            <div className="pw-welcome-top">
              <div className="pw-profile-line">
                {avatarUrl ? (
                  <img src={avatarUrl} className="pw-profile-avatar" alt="Foto de perfil" />
                ) : (
                  <div className="pw-profile-avatar pw-profile-avatar--fallback">{initialsFromName(profile?.full_name)}</div>
                )}

                <div>
                  <p className="pw-kicker">Bem-vindo ao PIRRIU</p>
                  <h1>Olá, {firstName} 👋</h1>
                  <p className="pw-welcome-sub">Conta de ID {account?.account_code || "-"}</p>
                </div>
              </div>

              <div className="pw-icon-soft">
                <ShieldCheck size={36} />
              </div>
            </div>

            <div className="pw-status-row">
              <span className="pw-pill pw-pill-yellow">{plan?.name || "Basic"}</span>
              <span className="pw-pill pw-pill-soft">{account?.subscription_status || "active"}</span>
            </div>
          </section>

          <section className="pw-stats-grid">
            {cards.map(([label, value, sub, Icon]) => (
              <article key={label} className="pw-card">
                <div className="pw-card-icon">
                  <Icon size={30} />
                </div>
                <h3>{label}</h3>
                <p className="pw-card-value">{value}</p>
                <p className="pw-card-sub">{sub}</p>
              </article>
            ))}
          </section>

          <section className="pw-info-grid">
            <article className="pw-card">
              <h2 className="pw-section-title">Perfil</h2>
              <div className="pw-detail-list">
                <p>Nome: <strong>{profile?.full_name || "-"}</strong></p>
                <p>E-mail: <strong>{profile?.email || auth.user.email}</strong></p>
                <p>Telefone: <strong>{profile?.phone || "-"}</strong></p>
                <p>ID da conta: <strong>{account?.account_code || "-"}</strong></p>
              </div>
            </article>

            <article className="pw-card">
              <h2 className="pw-section-title">Atividades recentes</h2>
              <div className="pw-activity-list">
                {["Pagamento recebido", "Cobrança gerada", "Ronda realizada"].map((item) => (
                  <div key={item} className="pw-activity">
                    <span>{item}</span>
                    <ChevronRight size={18} />
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </main>

      <footer className="pw-footer">PIRRIU © 2026 — Portal complementar do aplicativo.</footer>
    </div>
  );
}
