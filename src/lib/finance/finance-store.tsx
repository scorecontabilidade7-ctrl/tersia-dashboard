import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { parseDfcWorkbook } from "./parse-dfc";
import { ImportError, type FinanceDataset, type Period } from "./types";
import {
  resolvePeriods,
  previousWindow,
  type PeriodSelection,
} from "./selectors";

type Status = "empty" | "loading" | "ready" | "error";

type FinanceContextValue = {
  dataset: FinanceDataset | null;
  status: Status;
  errorMessage: string | null;
  successMessage: string | null;
  selection: PeriodSelection;
  setSelection: (s: PeriodSelection) => void;
  periods: Period[];
  periodKeys: string[];
  previousKeys: string[];
  importFile: (file: File) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<FinanceDataset | null>(null);
  const [status, setStatus] = useState<Status>("empty");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selection, setSelection] = useState<PeriodSelection>({ id: "this-year" });

  const importFile = useCallback(async (file: File) => {
    setStatus("loading");
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const parsed = await parseDfcWorkbook(file);
      setDataset(parsed);
      setSelection({ id: "this-year" });
      setStatus("ready");
      setSuccessMessage("Dados financeiros atualizados com sucesso.");
    } catch (error) {
      const message =
        error instanceof ImportError
          ? error.message
          : "Não foi possível importar a planilha. Verifique o arquivo e tente novamente.";
      setErrorMessage(message);
      // Dados atuais são preservados em caso de erro.
      setStatus((prev) => (prev === "loading" ? (dataset ? "ready" : "empty") : prev));
    }
  }, [dataset]);

  const periods = useMemo(
    () => (dataset ? resolvePeriods(dataset, selection) : []),
    [dataset, selection],
  );
  const periodKeys = useMemo(() => periods.map((p) => p.key), [periods]);
  const previousKeys = useMemo(
    () => (dataset ? previousWindow(dataset, periods).map((p) => p.key) : []),
    [dataset, periods],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      dataset,
      status: errorMessage && !dataset ? "error" : status,
      errorMessage,
      successMessage,
      selection,
      setSelection,
      periods,
      periodKeys,
      previousKeys,
      importFile,
    }),
    [dataset, status, errorMessage, successMessage, selection, periods, periodKeys, previousKeys, importFile],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
