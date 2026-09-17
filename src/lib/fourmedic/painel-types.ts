export interface ConvenioBreakdownItem {
  nome: string;
  quantidade: number;
  percentual: number;
}

export interface ProcedimentoRealizadoItem {
  id: number;
  nome: string;
  quantidade: number;
  totalReceita: number;
  ticketMedio: number;
  percentual: number;
}

export interface PacienteAtendidoItem {
  agendaId: number;
  dataHora: string;
  data: string;
  hora: string;
  pacienteNome: string;
  pacienteCpf?: string | null;
  pacienteFone?: string | null;
  profissionalNome: string;
  procedimentoNome: string;
  convenioNome: string;
  statusId: number;
  statusNome: string;
  statusVariant: "success" | "warning" | "danger" | "neutral" | "info";
  valorLiquido: number;
}

export interface ProcedimentoDonutItem {
  name: string;
  quantidade: number;
  percentual: number;
  color: string;
  subItems?: { nome: string; quantidade: number; percentual: number }[];
}

export interface FourMedicPainelSummary {
  periodo: {
    inicio: string;
    fim: string;
    mes: number;
    ano: number;
  };
  totalAgendados: number;
  totalConfirmados: number;
  totalAtendidos: number;
  totalCanceladosEAusentes: number;
  totalCancelados: number;
  totalAusentes: number;
  totalPendentes: number;
  taxaComparecimento: number;
  totalProcedimentosVolume: number;
  procedimentosDonut: ProcedimentoDonutItem[];
  conveniosBreakdown: ConvenioBreakdownItem[];
  procedimentosRealizados: ProcedimentoRealizadoItem[];
  pacientesAtendidos: PacienteAtendidoItem[];
  todosAgendamentos: PacienteAtendidoItem[];
}
