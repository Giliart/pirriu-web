import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export function safeAvatarUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("file://")) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function initialsFromName(name?: string | null) {
  const value = (name || "Usuário").trim();
  const parts = value.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || "U"}${parts[1]?.[0] || ""}`.toUpperCase();
}

export function getSubscriptionStatusLabel(status?: string | null) {
  const normalized = String(status || "").toLowerCase();

  switch (normalized) {
    case "active":
    case "authorized":
      return "Ativa";
    case "pending":
      return "Aguardando pagamento";
    case "cancelled":
    case "canceled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    case "paused":
      return "Pausada";
    case "overdue":
      return "Em atraso";
    case "failed":
      return "Falhou";
    case "trial":
      return "Teste";
    case "inactive":
      return "Inativa";
    default:
      return "Sem assinatura";
  }
}

export function isSubscriptionActiveForAccess(status?: string | null) {
  const normalized = String(status || "").toLowerCase();
  return ["active", "authorized", "trial"].includes(normalized);
}


function isPastDate(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

async function getBasicPlan() {
  const { data } = await supabaseAdmin
    .from("plans")
    .select("id, slug, name, max_active_clients, max_rounds, max_members, price_monthly, price_label, checkout_url, checkout_url_yearly, price_yearly_label")
    .or("slug.eq.basic,name.ilike.Basic")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

async function reconcileAccountSubscription(account: any) {
  if (!account?.id) return { account, latestSubscription: null, basicPlan: null };

  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("id, account_id, plan_id, plan_slug, plan_name, status, next_payment_date, cancelled_at, started_at, updated_at, created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = subscriptions || [];

  // Assinatura que dá direito ao plano: ativa/autorizada, ou cancelada mas ainda dentro do período pago.
  // Tentativas recusadas/canceladas sem started_at não devem derrubar uma assinatura válida anterior.
  const entitlementSubscription =
    rows.find((item: any) => ["active", "authorized"].includes(String(item.status || "").toLowerCase())) ||
    rows.find((item: any) => {
      const status = String(item.status || "").toLowerCase();
      return ["cancelled", "canceled"].includes(status) && !!item.started_at && !!item.next_payment_date && !isPastDate(item.next_payment_date);
    }) ||
    null;

  let latestSubscription = entitlementSubscription || rows[0] || null;
  let basicPlan: any = null;

  if (entitlementSubscription?.plan_id) {
    const desiredStatus = ["cancelled", "canceled"].includes(String(entitlementSubscription.status || "").toLowerCase())
      ? "active"
      : String(entitlementSubscription.status || "active").toLowerCase();

    if (account.plan_id !== entitlementSubscription.plan_id || account.subscription_status !== desiredStatus) {
      await supabaseAdmin
        .from("accounts")
        .update({
          plan_id: entitlementSubscription.plan_id,
          subscription_status: desiredStatus,
        })
        .eq("id", account.id);

      account = { ...account, plan_id: entitlementSubscription.plan_id, subscription_status: desiredStatus };
    }

    return { account, latestSubscription, basicPlan };
  }

  // IMPORTANTE:
  // Sem assinatura válida NÃO derruba mais o plano da conta.
  // A fonte de verdade do plano exibido/liberado é accounts.plan_id + accounts.subscription_status.
  // Isso permite liberação manual por Pix/suporte sem o portal voltar automaticamente para Basic.
  //
  // A tabela subscriptions fica como histórico/controle de recorrência.
  // Somente o webhook/cancelamento explícito deve alterar accounts.plan_id.
  basicPlan = await getBasicPlan();

  return { account, latestSubscription, basicPlan };
}

export async function getPortalOverview(userId: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, account_id, full_name, email, phone, avatar_url, pix_key, pix_message_template")
    .eq("id", userId)
    .maybeSingle();

  const accountId = profile?.account_id || null;

  const { data: rawAccount } = accountId
    ? await supabase
        .from("accounts")
        .select("id, account_code, name, plan_id, subscription_status, max_active_clients_override, max_rounds_override, max_members_override")
        .eq("id", accountId)
        .maybeSingle()
    : { data: null } as any;

  const { account, latestSubscription } = await reconcileAccountSubscription(rawAccount);

  const { data: plan } = account?.plan_id
    ? await supabase
        .from("plans")
        .select("id, slug, name, max_active_clients, max_rounds, max_members, price_monthly, price_label, checkout_url, checkout_url_yearly, price_yearly_label")
        .eq("id", account.plan_id)
        .maybeSingle()
    : { data: null } as any;

  const finalPlan = plan || {
    name: "Basic",
    slug: "basic",
    max_active_clients: account?.max_active_clients_override || 60,
    max_rounds: account?.max_rounds_override || 1,
    max_members: account?.max_members_override || 1,
  };

  const [activeClientsRes, lateClientsRes, pendingClientsRes, monthlyRes, roundsRes] = accountId
    ? await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("account_id", accountId).eq("is_active", true),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("account_id", accountId).eq("status", "Atrasado"),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("account_id", accountId).eq("status", "Pendente"),
        supabase.from("clients").select("monthly_fee").eq("account_id", accountId).eq("is_active", true),
        supabase.from("rounds").select("id", { count: "exact", head: true }).eq("account_id", accountId).eq("is_active", true),
      ])
    : [
        { count: 0 },
        { count: 0 },
        { count: 0 },
        { data: [] },
        { count: 0 },
      ];

  const monthlyTotal = ((monthlyRes as any)?.data || []).reduce((sum: number, item: any) => sum + Number(item.monthly_fee || 0), 0);

  return {
    profile,
    profileError,
    account,
    latestSubscription,
    plan: finalPlan,
    avatarUrl: safeAvatarUrl(profile?.avatar_url),
    stats: {
      activeClients: activeClientsRes.count || 0,
      lateClients: lateClientsRes.count || 0,
      pendingClients: pendingClientsRes.count || 0,
      activeRounds: roundsRes.count || 0,
      monthlyTotal,
    },
  };
}
