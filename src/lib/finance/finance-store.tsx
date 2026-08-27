import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseDfcWorkbook } from "./parse-dfc";
import { ImportError, type FinanceDataset, type Period } from "./types";
import { resolvePeriods, previousWindow, type PeriodSelection } from "./selectors";

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

/** Chave usada para persistir a última planilha importada no navegador. */
const STORAGE_KEY = "tersia-dashboard-dataset:v1";

/** Tenta carregar a última planilha importada do armazenamento local. */
function loadStoredDataset(): FinanceDataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.periods) ||
      !parsed.receitas
    ) {
      return null;
    }
    return parsed as FinanceDataset;
  } catch {
    return null;
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    const stored = loadStoredDataset();
    return {
      dataset: stored,
      status: (stored ? "ready" : "empty") as Status,
    };
  });
  const [dataset, setDataset] = useState<FinanceDataset | null>(initial.dataset);
  const [status, setStatus] = useState<Status>(initial.status);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selection, setSelection] = useState<PeriodSelection>({ id: "this-year" });

  // Persiste a última planilha importada para que, ao recarregar a página ou
  // abrir o link, os últimos valores importados já estejam disponíveis.
  useEffect(() => {
    try {
      if (dataset) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Armazenamento indisponível; apenas não persiste.
    }
  }, [dataset]);

  const importFile = useCallback(
    async (file: File) => {
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
    },
    [dataset],
  );

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
    [
      dataset,
      status,
      errorMessage,
      successMessage,
      selection,
      periods,
      periodKeys,
      previousKeys,
      importFile,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
