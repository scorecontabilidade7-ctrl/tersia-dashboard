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
import {
  resolvePeriods,
  previousWindow,
  sumSeries,
  totalDespesas,
  type PeriodSelection,
} from "./selectors";
import {
  fetchLatestFinanceDataset,
  saveFinanceDataset,
  subscribeToFinanceUpdates,
} from "@/lib/supabase/client";

type Status = "empty" | "loading" | "ready" | "error";

type FinanceContextValue = {
  dataset: FinanceDataset | null;
  status: Status;
  isCloudSyncing: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  selection: PeriodSelection;
  setSelection: (s: PeriodSelection) => void;
  periods: Period[];
  periodKeys: string[];
  previousKeys: string[];
  importFile: (file: File) => Promise<void>;
  refreshFromCloud: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

/** Chave usada para persistir a última planilha importada no navegador (cache offline). */
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

/** Obtém a seleção padrão: o mês mais recente disponível que realmente possui dados/movimentação financeira. */
function getDefaultSelection(dataset: FinanceDataset | null): PeriodSelection {
  if (!dataset || !Array.isArray(dataset.periods) || dataset.periods.length === 0) {
    return { id: "this-year" };
  }

  // Percorre os períodos do final para o início procurando o primeiro com receitas ou despesas preenchidas
  for (let i = dataset.periods.length - 1; i >= 0; i--) {
    const p = dataset.periods[i];
    const rec = sumSeries(dataset.receitas, [p.key]);
    const desp = totalDespesas(dataset, [p.key]);
    if (Math.abs(rec) > 0.005 || Math.abs(desp) > 0.005) {
      return { id: "custom", from: p.key, to: p.key };
    }
  }

  // Caso nenhum mês tenha movimentação registrada, seleciona o último período
  const latest = dataset.periods[dataset.periods.length - 1];
  return { id: "custom", from: latest.key, to: latest.key };
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    const stored = loadStoredDataset();
    return {
      dataset: stored,
      status: (stored ? "ready" : "empty") as Status,
      selection: getDefaultSelection(stored),
    };
  });
  const [dataset, setDataset] = useState<FinanceDataset | null>(initial.dataset);
  const [status, setStatus] = useState<Status>(initial.status);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selection, setSelection] = useState<PeriodSelection>(initial.selection);

  // 1. Carrega dados do Supabase na inicialização
  useEffect(() => {
    let isMounted = true;
    async function loadCloudData() {
      setIsCloudSyncing(true);
      try {
        const cloudDataset = await fetchLatestFinanceDataset();
        if (isMounted && cloudDataset) {
          setDataset(cloudDataset);
          setSelection(getDefaultSelection(cloudDataset));
          setStatus("ready");
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudDataset));
          } catch {
            // Silently ignore storage quota
          }
        }
      } catch (err) {
        console.warn("[FinanceStore] Erro ao sincronizar dados da nuvem:", err);
      } finally {
        if (isMounted) setIsCloudSyncing(false);
      }
    }

    void loadCloudData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Inscreve no canal Realtime do Supabase para refletir novos uploads ao vivo
  useEffect(() => {
    const unsubscribe = subscribeToFinanceUpdates((newDataset, fileName) => {
      setDataset(newDataset);
      setSelection(getDefaultSelection(newDataset));
      setStatus("ready");
      setSuccessMessage(`Novos dados sincronizados em tempo real (${fileName}).`);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDataset));
      } catch {
        // Silently ignore
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 3. Atualiza cache local quando dataset é alterado
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

  const refreshFromCloud = useCallback(async () => {
    setIsCloudSyncing(true);
    setErrorMessage(null);
    try {
      const cloudDataset = await fetchLatestFinanceDataset();
      if (cloudDataset) {
        setDataset(cloudDataset);
        setSelection(getDefaultSelection(cloudDataset));
        setStatus("ready");
        setSuccessMessage("Dados atualizados a partir da nuvem com sucesso.");
      }
    } catch {
      setErrorMessage("Não foi possível atualizar dados da nuvem.");
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  const importFile = useCallback(
    async (file: File) => {
      setStatus("loading");
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        const parsed = await parseDfcWorkbook(file);
        setDataset(parsed);
        setSelection(getDefaultSelection(parsed));
        setStatus("ready");
        setSuccessMessage("Dados financeiros importados localmente. Salvando na nuvem...");

        // Persiste no Supabase
        const result = await saveFinanceDataset(file.name, parsed);
        if (result.success) {
          setSuccessMessage("Dados financeiros salvos na nuvem e sincronizados em tempo real!");
        } else {
          setSuccessMessage(
            "Dados carregados na sessão atual (falha temporária ao sincronizar com nuvem).",
          );
        }
      } catch (error) {
        const message =
          error instanceof ImportError
            ? error.message
            : "Não foi possível importar a planilha. Verifique o arquivo e tente novamente.";
        setErrorMessage(message);
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
      isCloudSyncing,
      errorMessage,
      successMessage,
      selection,
      setSelection,
      periods,
      periodKeys,
      previousKeys,
      importFile,
      refreshFromCloud,
    }),
    [
      dataset,
      status,
      isCloudSyncing,
      errorMessage,
      successMessage,
      selection,
      periods,
      periodKeys,
      previousKeys,
      importFile,
      refreshFromCloud,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
