import { useState, useMemo } from "react";
import {
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Search,
  Activity,
  PieChart as PieChartIcon,
  Layers,
  Sparkles,
  Trophy,
  BarChart3,
  LayoutGrid,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip,
} from "recharts";
import {
  type ProcedimentoRealizadoItem,
  type ProcedimentoDonutItem,
} from "@/lib/fourmedic/painel-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PainelProcedimentosAccordionProps {
  procedimentos: ProcedimentoRealizadoItem[];
  donutData?: ProcedimentoDonutItem[];
}

export function PainelProcedimentosAccordion({
  procedimentos,
  donutData = [],
}: PainelProcedimentosAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showOutrosDetails, setShowOutrosDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"lista" | "ranking">("lista");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return procedimentos;
    const term = searchTerm.toLowerCase();
    return procedimentos.filter((p) => p.nome.toLowerCase().includes(term));
  }, [procedimentos, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalProcs = procedimentos.reduce((acc, p) => acc + p.quantidade, 0);

  const outrosItem = donutData.find((d) => d.name === "Outros");

  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  const activeDonutItem = activeDonutIndex !== null ? donutData[activeDonutIndex] : null;

  return (
    <div className="rounded-3xl border border-border/60 bg-card shadow-2xs overflow-hidden transition-all">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Procedimentos Realizados (Visão Consolidada)
            </h3>
            <p className="text-xs text-muted-foreground">
              Gráfico oficial de distribuição por procedimento · Total: {totalProcs} execuções
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary hidden sm:inline">
            {totalProcs} procedimentos
          </span>
          <div className="h-8 w-8 rounded-xl bg-muted/60 grid place-items-center text-muted-foreground">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-5 pb-6 md:px-6 space-y-6 border-t border-border/40 pt-5">
          {/* SEÇÃO 1: GRÁFICO DE ROSCA OFICIAL 4MEDIC + LEGENDA */}
          {donutData.length > 0 && (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-5 rounded-3xl bg-muted/20 border border-border/50">
              {/* Gráfico de Rosca com Centro Interativo Inteligente (Zero Sobreposição) */}
              <div className="relative w-full max-w-[280px] h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="quantidade"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="none"
                      onMouseEnter={(_, index) => setActiveDonutIndex(index)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                    >
                      {donutData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={entry.color}
                          opacity={activeDonutIndex === null || activeDonutIndex === index ? 1 : 0.55}
                          className="transition-all duration-200 cursor-pointer"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Texto Central da Rosca Dinâmico e Limpo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-3 text-center select-none">
                  {activeDonutItem ? (
                    <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150 max-w-[125px]">
                      <div className="flex items-center gap-1.5 mb-1 max-w-full">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: activeDonutItem.color }}
                        />
                        <span
                          className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate max-w-[100px]"
                          title={activeDonutItem.name}
                        >
                          {activeDonutItem.name}
                        </span>
                      </div>
                      <span className="text-2xl font-black text-foreground leading-none">
                        {activeDonutItem.quantidade}
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground mt-0.5">
                        {activeDonutItem.percentual.toFixed(1)}% do total
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Total
                      </span>
                      <span className="text-2xl font-black text-foreground leading-none my-0.5">
                        {totalProcs}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        procedimentos
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legenda Oficial das Fatias (Top 4 + Outros) Interativa */}
              <div className="flex-1 w-full space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Distribuição Percentual:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {donutData.map((item, idx) => {
                    const isHovered = activeDonutIndex === idx;
                    return (
                      <div
                        key={item.name}
                        onMouseEnter={() => setActiveDonutIndex(idx)}
                        onMouseLeave={() => setActiveDonutIndex(null)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-2xl bg-card border transition-all cursor-pointer",
                          isHovered
                            ? "border-primary shadow-xs bg-muted/30 scale-[1.02]"
                            : "border-border/50 hover:border-border hover:bg-muted/20",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs transition-transform"
                            style={{
                              backgroundColor: item.color,
                              transform: isHovered ? "scale(1.2)" : "scale(1)",
                            }}
                          />
                          <span className="text-xs font-bold text-foreground truncate" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-foreground">
                            {item.quantidade}
                          </span>
                          <span className="ml-1.5 text-[11px] font-bold text-muted-foreground">
                            ({item.percentual.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botão de Expansão da fatia "Outros" */}
                {outrosItem && outrosItem.subItems && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOutrosDetails(!showOutrosDetails)}
                      className="text-xs text-primary font-bold gap-1.5 hover:bg-primary/10 rounded-xl"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>
                        {showOutrosDetails
                          ? "Ocultar detalhamento de 'Outros'"
                          : `Ver os ${outrosItem.quantidade} procedimentos dentro de 'Outros'`}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DETALHAMENTO DE OUTROS QUANDO EXPANDIDO */}
          {showOutrosDetails && outrosItem?.subItems && (
            <div className="p-4 rounded-3xl bg-purple-500/5 border border-purple-500/20 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-500" />
                <h4 className="text-xs font-bold text-foreground">
                  Detalhamento da fatia "Outros" ({outrosItem.quantidade} procedimentos):
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {outrosItem.subItems.map((s) => (
                  <div
                    key={s.nome}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40"
                  >
                    <span className="font-semibold text-foreground truncate mr-2" title={s.nome}>
                      {s.nome}
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">
                      {s.quantidade}x ({s.percentual.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEÇÃO 2: CONTROLES DE VISUALIZAÇÃO (LISTA PAGINADA OU RANKING TOP 5) */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border/40">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {viewMode === "ranking"
                    ? "🏆 Ranking dos Top 5 Procedimentos"
                    : `Todos os Procedimentos (${filtered.length}):`}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {viewMode === "ranking"
                    ? "Procedimentos com maior volume de execução e participação clínica"
                    : `Exibindo ${paginated.length} de ${filtered.length} itens (Página ${currentPage} de ${totalPages})`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Switcher de Visão: Lista Paginada vs Ver Ranking */}
                <div className="inline-flex rounded-2xl bg-muted/60 p-1 border border-border/50 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("lista")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      viewMode === "lista"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                    <span>Lista Geral</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("ranking")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      viewMode === "ranking"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Trophy className="h-3.5 w-3.5" />
                    <span>Ver Ranking (Top 5)</span>
                  </button>
                </div>

                {/* Campo de Busca (Apenas na visão lista) */}
                {viewMode === "lista" && (
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Filtrar por nome..."
                      className="pl-8 h-8 text-xs rounded-xl bg-muted/30 border-border/60"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* VISÃO 1: RANKING DOS TOP 5 PROCEDIMENTOS (GRÁFICO DE BARRAS HORIZONTAL + CARDS) */}
            {viewMode === "ranking" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {(() => {
                  const top5 = procedimentos.slice(0, 5);
                  const top5Sum = top5.reduce((acc, p) => acc + p.quantidade, 0);
                  const top5Pct = totalProcs > 0 ? (top5Sum / totalProcs) * 100 : 0;
                  const maxQty = top5[0]?.quantidade || 1;
                  const RANK_COLORS = ["#0284C7", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6"];
                  const RANK_MEDALS = ["🥇", "🥈", "🥉", "🏅", "🏅"];

                  const chartData = top5.map((p, idx) => ({
                    name: p.nome.length > 25 ? `${p.nome.substring(0, 23)}...` : p.nome,
                    fullName: p.nome,
                    quantidade: p.quantidade,
                    percentual: p.percentual,
                    color: RANK_COLORS[idx % RANK_COLORS.length],
                    rank: idx + 1,
                  })).reverse(); // Inverte para o 1º ficar no topo do gráfico horizontal

                  return (
                    <div className="space-y-4">
                      {/* Banner de Destaque Executivo */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
                            <Trophy className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              Liderança de Procedimentos Clínicos
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Os 5 procedimentos líderes concentram <strong className="text-foreground">{top5Sum} execuções</strong> ({top5Pct.toFixed(1)}% do volume total).
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border/60 px-3 py-1.5 text-xs font-black text-primary shadow-2xs">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {top5Pct.toFixed(1)}% do Volume
                        </span>
                      </div>

                      {/* Grade de 2 Colunas: Gráfico de Barras à Esquerda + Cards com Medalhas à Direita */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Coluna 1: Gráfico de Barras Horizontal (Recharts) */}
                        <div className="lg:col-span-6 rounded-2xl bg-muted/20 border border-border/40 p-4 flex flex-col justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            Comparativo de Volume (Top 5):
                          </p>
                          <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  tick={{ fontSize: 11, fontWeight: 600 }}
                                  width={130}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const data = payload[0].payload;
                                    return (
                                      <div className="rounded-2xl border border-border bg-card p-3 shadow-md text-xs">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: data.color }}
                                          />
                                          <span className="font-bold text-foreground">
                                            #{data.rank} - {data.fullName}
                                          </span>
                                        </div>
                                        <div className="mt-1.5 flex items-baseline gap-2">
                                          <span className="text-sm font-black text-foreground">
                                            {data.quantidade} execuções
                                          </span>
                                          <span className="font-bold text-muted-foreground">
                                            ({data.percentual.toFixed(1)}% do total)
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }}
                                />
                                <Bar
                                  dataKey="quantidade"
                                  radius={[0, 8, 8, 0]}
                                  barSize={20}
                                >
                                  {chartData.map((entry) => (
                                    <Cell key={`bar-${entry.name}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Coluna 2: Cards de Ranking com Barras de Progresso e Medalhas */}
                        <div className="lg:col-span-6 space-y-2.5">
                          {top5.map((p, idx) => {
                            const medal = RANK_MEDALS[idx];
                            const color = RANK_COLORS[idx];
                            const relativePct = maxQty > 0 ? (p.quantidade / maxQty) * 100 : 0;

                            return (
                              <div
                                key={p.nome}
                                className="p-3 rounded-2xl bg-card border border-border/50 hover:border-border transition-all shadow-2xs space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <span className="text-base shrink-0">{medal}</span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-foreground truncate" title={p.nome}>
                                        {p.nome}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="text-xs font-black text-foreground">
                                      {p.quantidade} execuções
                                    </span>
                                    <span className="ml-1.5 text-[11px] font-bold text-muted-foreground">
                                      ({p.percentual.toFixed(1)}%)
                                    </span>
                                  </div>
                                </div>

                                {/* Barra de Progresso Visual */}
                                <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${relativePct}%`,
                                      backgroundColor: color,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* VISÃO 2: LISTA GERAL DE PROCEDIMENTOS PAGINADA */}
            {viewMode === "lista" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* Grid dos Procedimentos Paginados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paginated.map((p, idx) => {
                    const globalRank = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                    return (
                      <div
                        key={p.nome}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-border/40 hover:border-border/80 hover:bg-muted/40 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-black text-primary">
                            #{globalRank}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate" title={p.nome}>
                              {p.nome}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {p.percentual.toFixed(1)}% do volume total
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1 rounded-xl bg-primary/15 px-2.5 py-1 text-xs font-black text-primary">
                            <Activity className="h-3 w-3" />
                            {p.quantidade} {p.quantidade === 1 ? "execução" : "execuções"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filtered.length === 0 && (
                  <p className="text-center py-6 text-xs text-muted-foreground">
                    Nenhum procedimento encontrado com o termo "{searchTerm}".
                  </p>
                )}

                {/* Controles de Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground">
                    <span>
                      Página <strong className="text-foreground">{currentPage}</strong> de{" "}
                      <strong className="text-foreground">{totalPages}</strong> ({filtered.length} procedimentos)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-3 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Anterior
                      </Button>

                      {/* Números das páginas */}
                      <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer",
                              currentPage === page
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
