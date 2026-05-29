import { createClient } from "@/lib/supabase-server";

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

export async function getPortalOverview(userId: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, account_id, full_name, email, phone, avatar_url, pix_key, pix_message_template")
    .eq("id", userId)
    .maybeSingle();

  const accountId = profile?.account_id || null;

  const { data: account } = accountId
    ? await supabase
        .from("accounts")
        .select("id, account_code, name, plan_id, subscription_status, max_active_clients_override, max_rounds_override, max_members_override")
        .eq("id", accountId)
        .maybeSingle()
    : { data: null } as any;

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
