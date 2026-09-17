export interface FourMedicProcedureItem {
  id_procedimento: number;
  id_convenio?: number | null;
  convenio_nome?: string | null;
  procedimento_nome: string;
  procedimento_valor: string | number;
  procedimento_desconto?: string | number | null;
  procedimento_custo?: string | number | null;
  procedimento_duracao?: number | null;
}

export interface FourMedicAppointment {
  id_agenda: number;
  id_agenda_status: number;
  agenda_data_hora_inicio: string;
  agenda_data_hora_fim?: string | null;
  agenda_data_hora_chegada?: string | null;
  agenda_data_hora_ultima_alteracao?: string | null;
  agenda_observacao?: string | null;
  agenda_cancelamento_justificativa?: string | null;
  agenda_paciente_preferencial?: string | null;
  paciente_cpf?: string | null;
  paciente_nome: string;
  paciente_fone_1?: string | null;
  paciente_fone_2?: string | null;
  paciente_email?: string | null;
  profissional_nome: string;
  agenda_procedimentos: FourMedicProcedureItem[];
}

export interface FourMedicStatus {
  id_status: number;
  status_nome: string;
}

export interface FourMedicConvenio {
  id_convenio: number;
  convenio_nome: string;
}

export interface FlatProcedureRow {
  id: string;
  agendaId: number;
  dataHora: string;
  data: string;
  hora: string;
  pacienteNome: string;
  pacienteCpf?: string | null;
  pacienteFone?: string | null;
  profissionalNome: string;
  isDraTersia: boolean;
  procedimentoId: number;
  procedimentoNome: string;
  convenioNome: string;
  statusId: number;
  statusNome: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
  observacao?: string | null;
}

export interface ProcedureAggregate {
  nome: string;
  quantidade: number;
  totalReceita: number;
  ticketMedio: number;
  percentual: number;
}

export interface ConvenioAggregate {
  nome: string;
  quantidade: number;
  totalReceita: number;
  percentual: number;
}

export interface ProfessionalAggregate {
  nome: string;
  quantidade: number;
  totalReceita: number;
  percentual: number;
}

export interface FourMedicDashboardSummary {
  periodo: {
    inicio: string;
    fim: string;
    mes: number;
    ano: number;
  };
  totalFaturamento: number;
  totalProcedimentos: number;
  totalAtendimentos: number;
  ticketMedio: number;
  taxaConclusao: number;
  topProcedimentos: ProcedureAggregate[];
  distribuicaoConvenios: ConvenioAggregate[];
  distribuicaoProfissionais: ProfessionalAggregate[];
  rows: FlatProcedureRow[];
}
