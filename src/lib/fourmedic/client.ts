import { createServerFn } from "@tanstack/react-start";
import { type FourMedicAppointment } from "./types";

interface FetchAgendaParams {
  dataInicial: string; // formato "dd/mm/yyyy"
  dataFinal: string;   // formato "dd/mm/yyyy"
}

// Server Function que executa com segurança no backend Node/Nitro sem problemas de CORS
export const get4MedicAgendaServer = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as FetchAgendaParams)
  .handler(async ({ data }) => {
    const token =
      process.env.VITE_4MEDIC_API_TOKEN ||
      process.env.TOKEN_4MEDIC;

    if (!token) {
      return { success: false, data: [] as FourMedicAppointment[], error: "Token da 4Medic não configurado no ambiente (.env)." };
    }

    const apiUrl = process.env.VITE_4MEDIC_API_URL || "https://api.4medic.com.br/api/v1";
    const url = `${apiUrl}/agenda/search?data_inicial=${encodeURIComponent(data.dataInicial)}&data_final=${encodeURIComponent(data.dataFinal)}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`4Medic API Error [${response.status}]: ${errText}`);
      }

      const list = (await response.json()) as FourMedicAppointment[];
      return { success: true, data: list, error: null };
    } catch (err: any) {
      console.error("Erro ao consultar API da 4Medic no servidor:", err);
      return { success: false, data: [] as FourMedicAppointment[], error: err.message || "Erro de conexão com 4Medic" };
    }
  });

// Função client-side wrapper para ser chamada nos componentes e hooks
export async function fetch4MedicAgenda(dataInicial: string, dataFinal: string): Promise<FourMedicAppointment[]> {
  try {
    const result = await get4MedicAgendaServer({ data: { dataInicial, dataFinal } });
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    throw new Error(result.error || "Falha ao obter dados da 4Medic");
  } catch (error: any) {
    console.warn("ServerFn falhou, tentando chamada direta...", error);

    // Tentativa direta de fallback client-side
    const token =
      (import.meta as any).env?.VITE_4MEDIC_API_TOKEN ||
      (import.meta as any).env?.TOKEN_4MEDIC;
    
    if (!token) {
      throw new Error("Token da 4Medic não configurado no ambiente (.env).");
    }
    
    const apiUrl = (import.meta as any).env?.VITE_4MEDIC_API_URL || "https://api.4medic.com.br/api/v1";
    const url = `${apiUrl}/agenda/search?data_inicial=${encodeURIComponent(dataInicial)}&data_final=${encodeURIComponent(dataFinal)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Erro na API 4Medic: ${res.statusText}`);
    }

    return (await res.json()) as FourMedicAppointment[];
  }
}
