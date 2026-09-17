import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetch4MedicAgenda } from "./client";
import {
  buildDashboardSummary,
  type ProfessionalFilterOption,
} from "./transformers";
import { type FourMedicDashboardSummary } from "./types";

export function getMonthDateRange(mes: number, ano: number): { dataInicial: string; dataFinal: string } {
  // mes: 1 a 12
  const paddedMonth = String(mes).padStart(2, "0");
  const lastDay = new Date(ano, mes, 0).getDate();
  const paddedLastDay = String(lastDay).padStart(2, "0");

  return {
    dataInicial: `01/${paddedMonth}/${ano}`,
    dataFinal: `${paddedLastDay}/${paddedMonth}/${ano}`,
  };
}

export function useFourMedicData(
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

  const summary: FourMedicDashboardSummary = buildDashboardSummary(
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
