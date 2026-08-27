import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/lib/finance/finance-store";
import { formatDateTime } from "@/lib/finance/format";

export function ImportPlanilha() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { importFile, status, errorMessage, successMessage, dataset } = useFinance();

  const loading = status === "loading";

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setFileName(file.name);
    await importFile(file);
  };

  return (
    <div className="rounded-2xl bg-card p-5 border border-border/60">
      <h3 className="text-sm font-bold uppercase tracking-wider">Importar planilha financeira</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Envie o arquivo XLSX contendo a aba <strong>DFC ANO</strong>.
      </p>

      <div
        onClick={() => !loading && inputRef.current?.click()}
        className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition hover:border-primary/50 hover:bg-muted/60"
      >
        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-semibold">Processando arquivo...</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </>
        ) : dataset ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm font-semibold">{dataset.fileName}</p>
            <p className="text-xs text-success">Dados financeiros atualizados com sucesso.</p>
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

      {dataset && !loading && (
        <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Última atualização</p>
          <p className="mt-0.5 truncate">{dataset.fileName}</p>
          <p>{formatDateTime(dataset.importedAt)}</p>
        </div>
      )}

      {dataset && !loading && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet className="h-4 w-4" /> Trocar arquivo
        </Button>
      )}

      {successMessage && !dataset && (
        <p className="mt-2 text-xs text-success">{successMessage}</p>
      )}
    </div>
  );
}
