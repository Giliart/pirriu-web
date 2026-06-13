import { redirect } from "next/navigation";
import { Activity, BadgeCheck, CreditCard, MapPinned, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase-server";
import { moneyBRL } from "@/lib/format";
import { getPortalOverview, getSubscriptionStatusLabel } from "@/lib/portal-data";

function statusLabel(status?: string | null) {
  const value = String(status || "active").toLowerCase();
  if (value === "active") return "Ativa";
  if (value === "pending") return "Pendente";
  if (value === "cancelled" || value === "canceled") return "Cancelada";
  if (value === "overdue") return "Em atraso";
  return status || "Ativa";
}

export default async function ResumoPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");

  const { profile, account, plan, avatarUrl, stats } = await getPortalOverview(auth.user.id);

  const items = [
    ["Conta", account?.account_code || "-", BadgeCheck],
    ["Titular", profile?.full_name || "Usuário", Users],
    ["Plano atual", plan?.name || "Basic", ShieldCheck],
    ["Status", statusLabel(account?.subscription_status), Activity],
    ["Clientes ativos", `${stats.activeClients} / ${plan?.max_active_clients || "-"}`, Users],
    ["Rondas ativas", `${stats.activeRounds} / ${plan?.max_rounds || "-"}`, MapPinned],
    ["Pendentes", String(stats.pendingClients), CreditCard],
    ["Previsão mensal", moneyBRL(stats.monthlyTotal), ReceiptText],
  ] as const;

  return (
    <div className="pw-page pw-page-premium">
      <Header logged avatarUrl={avatarUrl} userName={profile?.full_name || account?.name} />

      <main className="pw-summary-page pw-modern-page">
        <div className="pw-container">
          <section className="pw-summary-card pw-summary-card--premium">
            <div className="pw-page-head pw-page-head--premium">
              <p className="pw-kicker">Resumo</p>
              <h1>Visão geral da conta</h1>
              <p>Dados principais do PIRRIU Web. Cadastros, rondas, cobranças e recibos continuam no aplicativo.</p>
            </div>

            <div className="pw-summary-grid pw-summary-grid--premium">
              {items.map(([label, value, Icon]) => (
                <div className="pw-summary-box pw-summary-box--premium" key={label}>
                  <div className="pw-summary-box-icon"><Icon size={22} /></div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="pw-footer">PIRRIU © 2026 — Portal complementar do aplicativo.</footer>
    </div>
  );
}
