import { useState, useMemo } from "react";
import {
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type FlatProcedureRow } from "@/lib/fourmedic/types";
import { formatCurrency } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

interface ProceduresTableProps {
  rows: FlatProcedureRow[];
  isLoading?: boolean;
}

export function ProceduresTable({ rows, isLoading = false }: ProceduresTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("todos");
  const [selectedConvenioFilter, setSelectedConvenioFilter] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Lista única de convênios para o filtro
  const conveniosList = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.convenioNome) set.add(r.convenioNome);
    });
    return Array.from(set).sort();
  }, [rows]);

  // Filtragem dos dados
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Busca textual
      const term = searchTerm.toLowerCase();
      const matchText =
        !searchTerm ||
        r.procedimentoNome.toLowerCase().includes(term) ||
        r.pacienteNome.toLowerCase().includes(term) ||
        (r.convenioNome && r.convenioNome.toLowerCase().includes(term)) ||
        (r.pacienteCpf && r.pacienteCpf.includes(term));

      // Filtro de status
      let matchStatus = true;
      if (selectedStatusFilter === "finalizados") {
        matchStatus = r.statusId === 7 || r.statusId === 101;
      } else if (selectedStatusFilter === "cancelados") {
        matchStatus = r.statusId === 4;
      } else if (selectedStatusFilter === "faltas") {
        matchStatus = r.statusId === 3;
      }

      // Filtro de convênio
      let matchConvenio = true;
      if (selectedConvenioFilter !== "todos") {
        matchConvenio = r.convenioNome === selectedConvenioFilter;
      }

      return matchText && matchStatus && matchConvenio;
    });
  }, [rows, searchTerm, selectedStatusFilter, selectedConvenioFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Totais da tabela filtrada (apenas atendimentos finalizados entram no faturamento real)
  const totalValorFiltrado = useMemo(() => {
    return filteredRows
      .filter((r) => {
        if (selectedStatusFilter === "cancelados") return r.statusId === 4;
        if (selectedStatusFilter === "faltas") return r.statusId === 3;
        return r.statusId === 7 || r.statusId === 101;
      })
      .reduce((acc, r) => acc + r.valorLiquido, 0);
  }, [filteredRows, selectedStatusFilter]);

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = ["Data", "Hora", "Procedimento", "Paciente", "CPF", "Médico", "Convênio", "Status", "Valor (R$)"];
    const csvRows = filteredRows.map((r) => [
      `"${r.data}"`,
      `"${r.hora}"`,
      `"${r.procedimentoNome.replace(/"/g, '""')}"`,
      `"${r.pacienteNome.replace(/"/g, '""')}"`,
      `"${r.pacienteCpf || ""}"`,
      `"${r.profissionalNome.replace(/"/g, '""')}"`,
      `"${r.convenioNome}"`,
      `"${r.statusNome}"`,
      r.valorLiquido.toFixed(2),
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...csvRows.map((e) => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Procedimentos_Tersia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (statusId: number, statusNome: string) => {
    if (statusId === 7 || statusId === 101) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          {statusNome}
        </span>
      );
    }
    if (statusId === 4) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="h-3 w-3" />
          Cancelado
        </span>
      );
    }
    if (statusId === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <AlertCircle className="h-3 w-3" />
          Falta / Ausente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
        <Clock className="h-3 w-3" />
        {statusNome}
      </span>
    );
  };

  return (
    <div className="flex flex-col rounded-3xl border border-border/60 bg-card shadow-2xs overflow-hidden">
      {/* Header da Tabela com Barra de Ferramentas */}
      <div className="p-5 md:p-6 border-b border-border/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Lançamentos Detalhados de Procedimentos
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Extrato operacional com rastreabilidade de cada atendimento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredRows.length === 0}
              className="rounded-xl border-border/80 text-xs font-bold gap-1.5 h-9"
            >
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>

        {/* Filtros rápidos e busca */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Campo de Busca */}
          <div className="relative md:col-span-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Pesquisar por procedimento, paciente ou CPF..."
              className="pl-9 pr-4 h-9 rounded-xl text-xs bg-background/60 border-border/70"
            />
          </div>

          {/* Filtro de Status */}
          <div className="md:col-span-3">
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-xl border border-border/70 bg-background/60 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="finalizados">Finalizados (Atendidos)</option>
              <option value="faltas">Faltas / Ausentes</option>
              <option value="cancelados">Cancelados</option>
            </select>
          </div>

          {/* Filtro de Convênio */}
          <div className="md:col-span-3">
            <select
              value={selectedConvenioFilter}
              onChange={(e) => {
                setSelectedConvenioFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 rounded-xl border border-border/70 bg-background/60 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="todos">Todos os Convênios</option>
              {conveniosList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Procedimentos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Data / Hora</th>
              <th className="px-5 py-3">Procedimento Realizado</th>
              <th className="px-5 py-3">Paciente</th>
              <th className="px-5 py-3">Convênio</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Valor Líquido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  Carregando dados da API 4Medic...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  Nenhum procedimento encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Data e Hora */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-foreground">
                    <span className="font-bold">{row.data}</span>
                    <span className="text-muted-foreground ml-1.5 text-[11px]">
                      {row.hora}
                    </span>
                  </td>

                  {/* Procedimento */}
                  <td className="px-5 py-3.5 text-foreground max-w-xs">
                    <p className="font-bold truncate text-foreground group-hover:text-primary transition-colors" title={row.procedimentoNome}>
                      {row.procedimentoNome}
                    </p>
                    {row.observacao && (
                      <p className="text-[10px] text-muted-foreground truncate" title={row.observacao}>
                        Obs: {row.observacao}
                      </p>
                    )}
                  </td>

                  {/* Paciente */}
                  <td className="px-5 py-3.5 text-foreground max-w-[200px]">
                    <p className="font-semibold truncate text-foreground" title={row.pacienteNome}>
                      {row.pacienteNome}
                    </p>
                    {row.pacienteCpf && (
                      <p className="text-[10px] text-muted-foreground">
                        CPF: {row.pacienteCpf}
                      </p>
                    )}
                  </td>

                  {/* Convênio */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-foreground border border-border/60">
                      {row.convenioNome || "Particular"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(row.statusId, row.statusNome)}
                  </td>

                  {/* Valor */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        "font-black text-sm",
                        row.valorLiquido > 0
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatCurrency(row.valorLiquido)}
                    </span>
                    {row.desconto > 0 && (
                      <p className="text-[10px] text-red-500 font-semibold">
                        Desc: -{formatCurrency(row.desconto)}
                      </p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer com Resumo & Paginação */}
      <div className="p-4 border-t border-border/40 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-muted-foreground">
          Exibindo <span className="font-bold text-foreground">{paginatedRows.length}</span> de{" "}
          <span className="font-bold text-foreground">{filteredRows.length}</span> lançamentos
          {filteredRows.length > 0 && (
            <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
              · Total Filtrado: {formatCurrency(totalValorFiltrado)}
            </span>
          )}
        </div>

        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold text-foreground px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
