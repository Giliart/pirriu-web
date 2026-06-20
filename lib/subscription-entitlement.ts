import { supabaseAdmin } from "@/lib/supabase-admin";

export type SubscriptionEntitlement = {
  id: string;
  account_id: string;
  plan_id: string | null;
  status: string | null;
  started_at: string | null;
  next_payment_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function normalizeStatus(status?: string | null) {
  return String(status || "").trim().toLowerCase();
}

function isFutureDate(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
}

export function hasPaidAccess(subscription?: Partial<SubscriptionEntitlement> | null) {
  if (!subscription?.plan_id) return false;

  const status = normalizeStatus(subscription.status);

  if (["active", "authorized", "trial"].includes(status)) return true;

  // Regra PIRRIU: cancelou a recorrência, mas mantém acesso até o fim do período já pago.
  if (["cancelled", "canceled"].includes(status)) {
    return Boolean(subscription.started_at && isFutureDate(subscription.next_payment_date));
  }

  return false;
}

export function accountStatusFromEntitlement(subscription?: Partial<SubscriptionEntitlement> | null) {
  if (!subscription) return null;

  const status = normalizeStatus(subscription.status);

  // Para o app/portal, cancelamento com período pago ainda deve aparecer/liberar como ativo.
  if (["cancelled", "canceled"].includes(status) && hasPaidAccess(subscription)) return "active";
  if (["authorized", "active", "trial"].includes(status)) return "active";

  return status || null;
}

export async function getBestEntitlement(accountId: string) {
  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("id, account_id, plan_id, status, started_at, next_payment_date, created_at, updated_at")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(30);

  const rows = (subscriptions || []) as SubscriptionEntitlement[];

  return (
    rows.find((item) => ["active", "authorized", "trial"].includes(normalizeStatus(item.status)) && !!item.plan_id) ||
    rows.find((item) => hasPaidAccess(item)) ||
    null
  );
}

export async function syncAccountEntitlement(accountId: string) {
  const entitlement = await getBestEntitlement(accountId);

  if (!entitlement?.plan_id) {
    return {
      updated: false,
      reason: "Sem assinatura com acesso pago vigente. Conta mantida como está para preservar liberações manuais.",
    };
  }

  const status = accountStatusFromEntitlement(entitlement) || "active";

  const { error } = await supabaseAdmin
    .from("accounts")
    .update({
      plan_id: entitlement.plan_id,
      subscription_status: status,
    })
    .eq("id", accountId);

  if (error) throw error;

  return {
    updated: true,
    account_id: accountId,
    plan_id: entitlement.plan_id,
    subscription_status: status,
    source_subscription_id: entitlement.id,
  };
}
