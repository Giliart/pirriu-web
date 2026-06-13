import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard, ShieldCheck, XCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase-server";
import { moneyBRL } from "@/lib/format";
import { getPortalOverview, getSubscriptionStatusLabel } from "@/lib/portal-data";

type PlanRow = {
  id: string;
  slug: string | null;
  name: string;
  max_active_clients: number;
  max_rounds: number;
  max_members: number;
  price_monthly: number | null;
  price_label: string | null;
  description: string | null;
  features: string[] | null;
  sort_order: number | null;
  checkout_url: string | null;
  checkout_url_yearly: string | null;
  price_yearly_label: string | null;
  is_featured: boolean | null;
};

function planPrice(plan: PlanRow) {
  if (plan.price_label) return plan.price_label;
  if (plan.price_monthly === null || plan.price_monthly === undefined) return "Sob consulta";
  return `${moneyBRL(Number(plan.price_monthly))}/mês`;
}

function normalize(value?: string | null) {
  return (value || "").toLowerCase().trim();
}

function getPlanRank(plan: Partial<PlanRow> | null | undefined) {
  const slug = normalize(plan?.slug);
  const name = normalize(plan?.name);

  if (slug.includes("black") || name.includes("black")) return 4;
  if (slug.includes("premium") || name.includes("premium")) return 3;
  if (slug.includes("plus") || name.includes("plus")) return 2;
  if (slug.includes("basic") || name.includes("basic")) return 1;

  return Number(plan?.sort_order || 0);
}

function getPlanAction(planItem: PlanRow, currentPlanId: string | null, currentPlan: any, currentPlanName: string) {
  const isCurrent =
    (currentPlanId && planItem.id === currentPlanId) ||
    normalize(planItem.slug) === normalize(currentPlan?.slug) ||
    normalize(planItem.name) === normalize(currentPlanName);

  if (isCurrent) {
    return {
      kind: "current" as const,
      label: "Plano atual",
      disabled: true,
    };
  }

  const currentRank = getPlanRank(currentPlan);
  const targetRank = getPlanRank(planItem);

  if (currentRank && targetRank && targetRank < currentRank) {
    return {
      kind: "downgrade" as const,
      label: "Plano inferior",
      disabled: true,
    };
  }

  return {
    kind: "upgrade" as const,
    label: "{buttonLabel}",
    disabled: false,
  };
}


function getPlanButtonLabel(planItem: PlanRow, action: ReturnType<typeof getPlanAction>) {
  if (action.kind === "current") return "PLANO ATUAL";
  if (action.kind === "downgrade") return "PLANO INFERIOR";

  const slug = normalize(planItem.slug);
  const name = normalize(planItem.name);

  if (slug.includes("black") || name.includes("black")) return "ATIVAR BLACK";
  if (slug.includes("premium") || name.includes("premium")) return "ATIVAR PREMIUM";
  if (slug.includes("plus") || name.includes("plus")) return "ATIVAR PLUS";
  if (slug.includes("basic") || name.includes("basic")) return "ATIVAR BASIC";

  return "ATIVAR PLANO";
}

export default async function AssinaturaPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");

  const { account, plan: currentPlan, avatarUrl, stats } = await getPortalOverview(auth.user.id);

  const { data: plansData } = await supabase
    .from("plans")
    .select("id, slug, name, max_active_clients, max_rounds, max_members, price_monthly, price_label, description, features, sort_order, checkout_url, checkout_url_yearly, price_yearly_label, is_featured")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const plans = ((plansData || []) as PlanRow[]).length
    ? ((plansData || []) as PlanRow[])
    : [
        {
          id: "basic",
          slug: "basic",
          name: "Basic",
          max_active_clients: 60,
          max_rounds: 1,
          max_members: 1,
          price_monthly: 0,
          price_label: "GRÁTIS",
          description: "Plano inicial para começar sua operação.",
          features: ["Gestão básica de clientes", "Recibos pelo WhatsApp", "Funções principais no aplicativo"],
          sort_order: 1,
          checkout_url: null,
          checkout_url_yearly: null,
          price_yearly_label: null,
          is_featured: false,
        },
      ];

  const currentPlanName = currentPlan?.name || "Basic";
  const currentPlanId = account?.plan_id || null;

  return (
    <div className="pw-page">
      <Header logged avatarUrl={avatarUrl} userName={account?.name} />

      <main className="pw-subscription-page">
        <div className="pw-container">
          <section className="pw-subscription-hero">
            <div>
              <p className="pw-kicker">Gerenciamento de assinatura</p>
              <h1>Plano atual: {currentPlanName}</h1>
              <p>
                Gerencie seu plano, acompanhe os limites da sua conta e faça upgrade pelo portal web do PIRRIU.
                As funções operacionais continuam no aplicativo.
              </p>
            </div>

            <div className="pw-subscription-status">
              <div className="pw-status-icon">
                <ShieldCheck size={34} />
              </div>
              <span>Status da assinatura</span>
              <strong>{getSubscriptionStatusLabel(account?.subscription_status) || "active"}</strong>
              <small>Conta {account?.account_code || "-"}</small>
            </div>
          </section>

          <section className="pw-subscription-metrics">
            <div className="pw-subscription-metric">
              <span>Clientes ativos</span>
              <strong>{stats.activeClients} / {currentPlan?.max_active_clients || "-"}</strong>
            </div>
            <div className="pw-subscription-metric">
              <span>Rondas ativas</span>
              <strong>{stats.activeRounds} / {currentPlan?.max_rounds || "-"}</strong>
            </div>
            <div className="pw-subscription-metric">
              <span>Membros permitidos</span>
              <strong>{currentPlan?.max_members || "-"}</strong>
            </div>
            <div className="pw-subscription-metric">
              <span>Previsão mensal</span>
              <strong>{moneyBRL(stats.monthlyTotal)}</strong>
            </div>
          </section>

          <div className="pw-section-title">
            <p className="pw-kicker">Planos disponíveis</p>
            <h2>Escolha o melhor plano para sua operação</h2>
          </div>

          <section className="pw-plans-grid">
            {plans.map((planItem) => {
              const action = getPlanAction(planItem, currentPlanId, currentPlan, currentPlanName);
              const buttonLabel = getPlanButtonLabel(planItem, action);
              const isCurrent = action.kind === "current";
              return (
                <article
                  key={planItem.id}
                  className={`pw-plan-card ${isCurrent ? "pw-plan-card--current" : ""} ${planItem.is_featured ? "pw-plan-card--featured" : ""} ${(planItem.slug || "").toLowerCase().includes("black") ? "pw-plan-card--black" : ""}`}
                >
                  <div className="pw-plan-card-top">
                    <div>
                      <span className="pw-plan-label">Plano</span>
                      <h3>{planItem.name}</h3>
                    </div>

                    {isCurrent ? (
                      <span className="pw-plan-badge pw-plan-badge--current">Atual</span>
                    ) : planItem.is_featured ? (
                      <span className="pw-plan-badge">Destaque</span>
                    ) : null}
                  </div>

                  <strong className="pw-plan-price">{planPrice(planItem)}</strong>

                  <p className="pw-plan-description">
                    {planItem.description || "Plano PIRRIU para gerenciamento de segurança, clientes, rondas e cobranças."}
                  </p>

                  <div className="pw-plan-limits">
                    <div>
                      <span>Clientes</span>
                      <strong>{planItem.max_active_clients}</strong>
                    </div>
                    <div>
                      <span>Rondas</span>
                      <strong>{planItem.max_rounds}</strong>
                    </div>
                    <div>
                      <span>Membros</span>
                      <strong>{planItem.max_members}</strong>
                    </div>
                  </div>

                  <ul className="pw-plan-features">
                    {[
                      ...(Array.isArray(planItem.features) ? planItem.features.slice(0, 4) : []),
                      "Resumo da conta no portal web",
                      "Funções principais no aplicativo",
                    ].slice(0, 5).map((feature) => (
                      <li key={feature}>
                        <CheckCircle2 size={17} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {action.kind === "current" ? (
                    <button className="pw-plan-button pw-plan-button--current" disabled>
                      {buttonLabel}
                    </button>
                  ) : action.kind === "downgrade" ? (
                    <button className="pw-plan-button pw-plan-button--disabled" disabled>
                      {buttonLabel}
                    </button>
                  ) : action.kind === "upgrade" ? (
                    <form action="/api/create-subscription" method="post">
                      <input type="hidden" name="plan_id" value={planItem.id} />
                      <button className="pw-plan-button pw-plan-button--upgrade" type="submit">
                        {buttonLabel}
                      </button>
                    </form>
                  ) : (
                    <button className="pw-plan-button pw-plan-button--disabled" disabled>
                      Indisponível
                    </button>
                  )}
                </article>
              );
            })}
          </section>

          <section className="pw-cancel-card">
            <div className="pw-cancel-icon">
              <XCircle size={30} />
            </div>

            <div>
              <p className="pw-kicker">Cancelamento</p>
              <h2>Cancelar assinatura</h2>
              <p>
                O cancelamento impedirá novas cobranças. A conta poderá continuar ativa até o fim do período já pago,
                conforme a regra do provedor de pagamento.
              </p>
            </div>

            <form action="/api/cancel-subscription" method="post">
              <button className="pw-cancel-button" type="submit">
                Cancelar assinatura
              </button>
            </form>
          </section>

          <section className="pw-payment-note">
            <CreditCard size={22} />
            <p>
              Upgrades usam checkout recorrente do Mercado Pago. Downgrade ficará disponível posteriormente para
              aplicação no próximo ciclo de cobrança.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
