import { useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Cloud,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/lib/finance/finance-store";
import { formatDateTime } from "@/lib/finance/format";
import { useAuth } from "@/lib/auth/auth-context";

export function ImportPlanilha() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const {
    importFile,
    status,
    isCloudSyncing,
    errorMessage,
    successMessage,
    dataset,
    refreshFromCloud,
  } = useFinance();
  const { isAdmin } = useAuth();

  const loading = status === "loading";

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setFileName(file.name);
    await importFile(file);
  };

  return (
    <div className="rounded-2xl bg-card p-5 border border-border/60">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wider">Planilha Financeira</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <Cloud className="h-3 w-3" />
          Nuvem Ativa
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {isAdmin
          ? "Envie o arquivo XLSX contendo a aba DFC ANO. Os dados são salvos na nuvem e sincronizados em tempo real."
          : "Visualização em tempo real dos dados financeiros sincronizados pelo administrador."}
      </p>

      {/* Se for Administrador: Exibe área de Upload */}
      {isAdmin ? (
        <>
          <div
            onClick={() => !loading && inputRef.current?.click()}
            className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition hover:border-primary/50 hover:bg-muted/60"
          >
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-semibold">Processando e salvando na nuvem...</p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </>
            ) : dataset ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="text-sm font-semibold">{dataset.fileName}</p>
                <p className="text-xs text-success">
                  Dados salvos na nuvem e sincronizados ao vivo.
                </p>
              </>
            ) : (
              <>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Clique para selecionar</p>
                <p className="text-xs text-muted-foreground">Formato aceito: .xlsx</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const input = e.target;
                void handleFile(input.files?.[0]).finally(() => {
                  input.value = "";
                });
              }}
            />
          </div>

          {errorMessage && !loading && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </>
      ) : (
        /* Se for Participante: Exibe aviso informativo seguro */
        <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-4 text-center">
          <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold text-foreground">Acesso de Participante</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Você tem permissão para consultar todos os gráficos, KPIs e relatórios. Apenas
            administradores podem importar novas planilhas.
          </p>
        </div>
      )}

      {/* Informações da Última Atualização */}
      {dataset && !loading && (
        <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">Última atualização em nuvem</p>
            <span className="flex items-center gap-1 text-[11px] text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Tempo Real
            </span>
          </div>
          <p className="mt-0.5 truncate font-medium text-foreground">{dataset.fileName}</p>
          <p>{formatDateTime(dataset.importedAt)}</p>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="mt-3 flex gap-2">
        {isAdmin && dataset && !loading && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet className="h-4 w-4" /> Trocar arquivo
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={isCloudSyncing || loading}
          className={`${isAdmin ? "" : "w-full"} gap-2 text-muted-foreground hover:text-foreground`}
          onClick={() => void refreshFromCloud()}
          title={isAdmin ? "Verificar atualizações no Supabase" : "Verificar novas atualizações"}
        >
          <RefreshCw className={`h-4 w-4 ${isCloudSyncing ? "animate-spin text-primary" : ""}`} />
          {isCloudSyncing ? "Sincronizando..." : isAdmin ? "Sincronizar Nuvem" : "Sincronizar Dados"}
        </Button>
      </div>

      {successMessage && !dataset && <p className="mt-2 text-xs text-success">{successMessage}</p>}
    </div>
  );
}
