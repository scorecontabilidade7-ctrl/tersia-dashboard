import { createClient } from "@supabase/supabase-js";
import type { FinanceDataset } from "@/lib/finance/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type TersiaRole = "admin" | "participante";

export type TersiaProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type TersiaUserWithRole = TersiaProfile & {
  role: TersiaRole;
};

export type TersiaDatasetRow = {
  id: string;
  file_name: string;
  imported_at: string;
  is_active: boolean;
  dataset: FinanceDataset;
  created_at: string;
  updated_at: string;
};

/**
 * Busca o dataset financeiro ativo mais recente do Supabase.
 */
export async function fetchLatestFinanceDataset(): Promise<FinanceDataset | null> {
  try {
    const { data, error } = await supabase
      .from("tersia_finance_datasets")
      .select("*")
      .eq("is_active", true)
      .order("imported_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[Supabase] Erro ao buscar dataset mais recente:", error.message);
      return null;
    }

    if (!data || !data.dataset) {
      return null;
    }

    return data.dataset as FinanceDataset;
  } catch (err) {
    console.warn("[Supabase] Falha de conexão ao buscar dataset:", err);
    return null;
  }
}

/**
 * Salva um novo dataset financeiro no Supabase.
 */
export async function saveFinanceDataset(
  fileName: string,
  dataset: FinanceDataset,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("tersia_finance_datasets")
      .insert({
        file_name: fileName,
        imported_at: dataset.importedAt || new Date().toISOString(),
        is_active: true,
        dataset: dataset,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Supabase] Erro ao salvar dataset:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[Supabase] Falha ao persistir no Supabase:", err);
    return { success: false, error: message };
  }
}

/**
 * Inscreve um listener em tempo real para atualizações na tabela tersia_finance_datasets.
 */
export function subscribeToFinanceUpdates(
  onUpdate: (dataset: FinanceDataset, fileName: string) => void,
) {
  const channel = supabase
    .channel("tersia_finance_realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "tersia_finance_datasets",
      },
      (payload) => {
        const row = payload.new as TersiaDatasetRow;
        if (row && row.dataset && row.is_active) {
          onUpdate(row.dataset, row.file_name);
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Busca perfil e role de um usuário do Tersia.
 */
export async function getTersiaUserProfile(
  userId: string,
): Promise<{ profile: TersiaProfile | null; role: TersiaRole }> {
  try {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("tersia_profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("tersia_user_roles").select("role").eq("user_id", userId).maybeSingle(),
    ]);

    const profile = profileRes.data ? (profileRes.data as TersiaProfile) : null;
    const role = (roleRes.data?.role as TersiaRole) || "participante";

    return { profile, role };
  } catch (err) {
    console.error("[Supabase Auth] Erro ao buscar perfil Tersia:", err);
    return { profile: null, role: "participante" };
  }
}

/**
 * Lista todos os usuários cadastrados no Tersia (apenas admins conseguem chamar com sucesso devido ao RLS).
 */
export async function listTersiaUsers(): Promise<TersiaUserWithRole[]> {
  try {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("tersia_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("tersia_user_roles").select("*"),
    ]);

    if (profilesRes.error || !profilesRes.data) {
      console.warn("[Supabase] Erro ao listar perfis:", profilesRes.error?.message);
      return [];
    }

    const rolesMap = new Map<string, TersiaRole>();
    (rolesRes.data || []).forEach((r) => {
      rolesMap.set(r.user_id, r.role as TersiaRole);
    });

    return profilesRes.data.map((p) => ({
      ...(p as TersiaProfile),
      role: rolesMap.get(p.id) || "participante",
    }));
  } catch (err) {
    console.error("[Supabase] Erro ao listar usuários:", err);
    return [];
  }
}

/**
 * Atualiza o cargo de um usuário no Tersia.
 */
export async function updateTersiaUserRole(
  userId: string,
  newRole: TersiaRole,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("tersia_user_roles")
      .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id,role" });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

/**
 * Atualiza status ativo/inativo de um perfil.
 */
export async function updateTersiaUserActive(
  userId: string,
  active: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("tersia_profiles")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}
