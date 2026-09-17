import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetch4MedicAgenda } from "./client";
import { buildFourMedicPainelSummary } from "./painel-transformers";
import { type FourMedicPainelSummary } from "./painel-types";
import { type ProfessionalFilterOption } from "./transformers";
import { getMonthDateRange } from "./use-fourmedic";

export function useFourMedicPainel(
  mes: number = 8,
  ano: number = 2026,
  filterProfessional: ProfessionalFilterOption = "tersia",
) {
  const queryClient = useQueryClient();
  const { dataInicial, dataFinal } = getMonthDateRange(mes, ano);

  const queryKey = ["fourmedic_agenda", dataInicial, dataFinal];

  const query = useQuery({
    queryKey,
    queryFn: () => fetch4MedicAgenda(dataInicial, dataFinal),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });

  const appointments = query.data || [];

  const summary: FourMedicPainelSummary = buildFourMedicPainelSummary(
    appointments,
    filterProfessional,
    {
      inicio: dataInicial,
      fim: dataFinal,
      mes,
      ano,
    },
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    summary,
    rawAppointments: appointments,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refresh: handleRefresh,
    dateRange: { dataInicial, dataFinal },
  };
}
