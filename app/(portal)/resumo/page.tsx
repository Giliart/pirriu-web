import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase-server";
import { moneyBRL } from "@/lib/format";
import { getPortalOverview } from "@/lib/portal-data";

export default async function ResumoPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");

  const { profile, account, plan, avatarUrl, stats } = await getPortalOverview(auth.user.id);

  return (
    <div className="pw-page">
      <Header logged avatarUrl={avatarUrl} userName={account?.name} />

      <main className="pw-summary-page">
        <div className="pw-container">
          <section className="pw-summary-card">
            <div className="pw-page-head">
              <p className="pw-kicker">Resumo</p>
              <h1>Resumo completo da conta</h1>
              <p>Esta área mostra somente uma visão geral. Cadastros, rondas, cobranças e recibos continuam no aplicativo.</p>
            </div>

            <div className="pw-summary-grid">
              <div className="pw-summary-box">
                Conta
                <strong>{account?.account_code || "-"}</strong>
              </div>
              <div className="pw-summary-box">
                Nome
                <strong>{profile?.full_name || "Usuário"}</strong>
              </div>
              <div className="pw-summary-box">
                Plano atual
                <strong>{plan?.name || "Basic"}</strong>
              </div>
              <div className="pw-summary-box">
                Status
                <strong>{account?.subscription_status || "active"}</strong>
              </div>
              <div className="pw-summary-box">
                Clientes ativos
                <strong>{stats.activeClients} / {plan?.max_active_clients || "-"}</strong>
              </div>
              <div className="pw-summary-box">
                Rondas ativas
                <strong>{stats.activeRounds} / {plan?.max_rounds || "-"}</strong>
              </div>
              <div className="pw-summary-box">
                Pendentes
                <strong>{stats.pendingClients}</strong>
              </div>
              <div className="pw-summary-box">
                Previsão mensal
                <strong>{moneyBRL(stats.monthlyTotal)}</strong>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="pw-footer">PIRRIU © 2026 — Portal complementar do aplicativo.</footer>
    </div>
  );
}
