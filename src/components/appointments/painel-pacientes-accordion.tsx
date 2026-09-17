import { useState, useMemo } from "react";
import { Users, ChevronDown, ChevronUp, Search, CheckCircle2, AlertCircle, Clock, Calendar, Phone } from "lucide-react";
import { type PacienteAtendidoItem } from "@/lib/fourmedic/painel-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PainelPacientesAccordionProps {
  pacientes: PacienteAtendidoItem[];
  todosAgendamentos: PacienteAtendidoItem[];
}

export function PainelPacientesAccordion({
  pacientes,
  todosAgendamentos,
}: PainelPacientesAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [viewFilter, setViewFilter] = useState<"atendidos" | "todos" | "faltas_cancelados">("atendidos");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const baseList = useMemo(() => {
    if (viewFilter === "atendidos") return pacientes;
    if (viewFilter === "faltas_cancelados") {
      return todosAgendamentos.filter((a) => a.statusId === 3 || a.statusId === 4);
    }
    return todosAgendamentos;
  }, [pacientes, todosAgendamentos, viewFilter]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return baseList;
    const term = searchTerm.toLowerCase();
    return baseList.filter(
      (p) =>
        p.pacienteNome.toLowerCase().includes(term) ||
        p.procedimentoNome.toLowerCase().includes(term) ||
        (p.convenioNome && p.convenioNome.toLowerCase().includes(term)) ||
        (p.pacienteCpf && p.pacienteCpf.includes(term)),
    );
  }, [baseList, searchTerm]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const getStatusBadge = (statusId: number, statusNome: string) => {
    if (statusId === 7 || statusId === 101) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Atendido
        </span>
      );
    }
    if (statusId === 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertCircle className="h-3 w-3" />
          Cancelado
        </span>
      );
    }
    if (statusId === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertCircle className="h-3 w-3" />
          Ausente / Falta
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Clock className="h-3 w-3" />
        {statusNome}
      </span>
    );
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card shadow-2xs overflow-hidden transition-all">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Pacientes & Consultas</h3>
            <p className="text-xs text-muted-foreground">
              {pacientes.length} pacientes atendidos · Grade completa de consultas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
            {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
          </span>
          <div className="h-8 w-8 rounded-xl bg-muted/60 grid place-items-center text-muted-foreground">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-5 pb-6 md:px-6 space-y-4 border-t border-border/40 pt-4">
          {/* Controles de Filtro e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Seletor de visualização */}
            <div className="inline-flex rounded-2xl bg-muted/60 p-1 border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setViewFilter("atendidos");
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer",
                  viewFilter === "atendidos"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                ✅ Atendidos ({pacientes.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewFilter("todos");
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer",
                  viewFilter === "todos"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                📅 Todos ({todosAgendamentos.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewFilter("faltas_cancelados");
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer",
                  viewFilter === "faltas_cancelados"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                🚫 Cancelados/Faltas
              </button>
            </div>

            {/* Busca rápida */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar paciente ou CPF..."
                className="pl-9 text-xs rounded-xl bg-muted/30 border-border/60"
              />
            </div>
          </div>

          {/* Tabela de Pacientes */}
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Procedimento</th>
                  <th className="py-3 px-4">Convênio</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginated.map((p) => (
                  <tr key={`${p.agendaId}-${p.dataHora}`} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">{p.data}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.hora}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{p.pacienteNome}</div>
                      {p.pacienteFone && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {p.pacienteFone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground">{p.procedimentoNome}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex rounded-lg bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                        {p.convenioNome}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(p.statusId, p.statusNome)}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      Nenhum paciente encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>
                Página <strong className="text-foreground">{currentPage}</strong> de{" "}
                <strong className="text-foreground">{totalPages}</strong> ({filtered.length} itens)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-xl text-xs"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-xl text-xs"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
