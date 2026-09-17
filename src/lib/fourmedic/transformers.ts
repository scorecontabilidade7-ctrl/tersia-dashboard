import {
  type FourMedicAppointment,
  type FlatProcedureRow,
  type FourMedicDashboardSummary,
  type ProcedureAggregate,
  type ConvenioAggregate,
  type ProfessionalAggregate,
} from "./types";
import {
  STATUS_MAP,
  isTersiaProfessional,
  parseMoney,
  isTestAppointment,
  FINALIZED_STATUS_IDS,
} from "./constants";

export type ProfessionalFilterOption = "tersia" | "pedro" | "todos";

export function transformAppointmentsToRows(
  appointments: FourMedicAppointment[],
  filterProfessional: ProfessionalFilterOption = "tersia",
): FlatProcedureRow[] {
  const rows: FlatProcedureRow[] = [];

  for (const appt of appointments) {
    // Ignora agendamentos de teste automatizado
    if (isTestAppointment(appt)) continue;

    const isTersia = isTersiaProfessional(appt.profissional_nome);

    if (filterProfessional === "tersia" && !isTersia) continue;
    if (filterProfessional === "pedro" && isTersia) continue;

    const dataHoraStr = appt.agenda_data_hora_inicio || "";
    const [dataPart, horaPart] = dataHoraStr.split(" ");
    
    // Formata data brasileira DD/MM/AAAA se vier YYYY-MM-DD
    let dataFormatada = dataPart || "";
    if (dataFormatada.includes("-")) {
      const [y, m, d] = dataFormatada.split("-");
      dataFormatada = `${d}/${m}/${y}`;
    }

    const statusInfo = STATUS_MAP[appt.id_agenda_status] || {
      label: `Status ${appt.id_agenda_status}`,
      variant: "neutral",
    };

    if (!appt.agenda_procedimentos || appt.agenda_procedimentos.length === 0) {
      // Agendamento sem procedimento explícito (ex: consulta geral ou bloqueio)
      if (appt.id_agenda_status !== 8) { // ignora apenas horários bloqueados vazios
        rows.push({
          id: `${appt.id_agenda}-0`,
          agendaId: appt.id_agenda,
          dataHora: dataHoraStr,
          data: dataFormatada,
          hora: horaPart ? horaPart.substring(0, 5) : "--:--",
          pacienteNome: appt.paciente_nome || "Paciente não informado",
          pacienteCpf: appt.paciente_cpf,
          pacienteFone: appt.paciente_fone_1,
          profissionalNome: appt.profissional_nome || "Dra. Térsia",
          isDraTersia: isTersia,
          procedimentoId: 0,
          procedimentoNome: "CONSULTA / ATENDIMENTO GERAL",
          convenioNome: "Particular",
          statusId: appt.id_agenda_status,
          statusNome: statusInfo.label,
          valorBruto: 0,
          desconto: 0,
          valorLiquido: 0,
          observacao: appt.agenda_observacao,
        });
      }
    } else {
      appt.agenda_procedimentos.forEach((proc, idx) => {
        const valorBruto = parseMoney(proc.procedimento_valor);
        const desconto = parseMoney(proc.procedimento_desconto);
        const valorLiquido = Math.max(0, valorBruto - desconto);

        rows.push({
          id: `${appt.id_agenda}-${idx}`,
          agendaId: appt.id_agenda,
          dataHora: dataHoraStr,
          data: dataFormatada,
          hora: horaPart ? horaPart.substring(0, 5) : "--:--",
          pacienteNome: appt.paciente_nome || "Paciente não informado",
          pacienteCpf: appt.paciente_cpf,
          pacienteFone: appt.paciente_fone_1,
          profissionalNome: appt.profissional_nome || "Dra. Térsia",
          isDraTersia: isTersia,
          procedimentoId: proc.id_procedimento,
          procedimentoNome: proc.procedimento_nome?.trim() || "Procedimento sem nome",
          convenioNome: proc.convenio_nome?.trim() || "Particular",
          statusId: appt.id_agenda_status,
          statusNome: statusInfo.label,
          valorBruto,
          desconto,
          valorLiquido,
          observacao: appt.agenda_observacao,
        });
      });
    }
  }

  return rows;
}

export function buildDashboardSummary(
  appointments: FourMedicAppointment[],
  filterProfessional: ProfessionalFilterOption = "tersia",
  periodo = { inicio: "", fim: "", mes: 8, ano: 2026 },
): FourMedicDashboardSummary {
  const rows = transformAppointmentsToRows(appointments, filterProfessional);

  // Filtragem estrita de faturamento: Apenas atendimentos REALIZADOS / FINALIZADOS
  // Status 7 = Finalizado pelo Médico | Status 101 = Finalizado pela Secretaria
  // Exclui Ausentes (Status 3), Cancelados (Status 4), Bloqueados (Status 8) e Agendados não realizados (Status 2)
  const activeRows = rows.filter((r) => FINALIZED_STATUS_IDS.includes(r.statusId));
  
  // Total faturado efetivo
  const totalFaturamento = activeRows.reduce((acc, r) => acc + r.valorLiquido, 0);
  const totalProcedimentos = activeRows.filter((r) => r.valorLiquido > 0 || r.procedimentoId > 0).length;
  
  // Total atendimentos únicos finalizados
  const uniqueAppointments = new Set(activeRows.map((r) => r.agendaId)).size;
  const ticketMedio = totalProcedimentos > 0 ? totalFaturamento / totalProcedimentos : 0;

  // Taxa de conclusão sobre agendamentos de pacientes válidos (excluindo apenas horários bloqueados)
  const patientAppointments = rows.filter((r) => r.statusId !== 8);
  const patientAppointmentIds = new Set(patientAppointments.map((r) => r.agendaId)).size;
  const taxaConclusao = patientAppointmentIds > 0 ? (uniqueAppointments / patientAppointmentIds) * 100 : 0;

  // Top Procedimentos Agregados (apenas realizados)
  const procMap: Record<string, { nome: string; quantidade: number; totalReceita: number }> = {};
  for (const r of activeRows) {
    const nome = r.procedimentoNome.toUpperCase();
    if (!procMap[nome]) {
      procMap[nome] = { nome: r.procedimentoNome, quantidade: 0, totalReceita: 0 };
    }
    procMap[nome].quantidade += 1;
    procMap[nome].totalReceita += r.valorLiquido;
  }

  const topProcedimentos: ProcedureAggregate[] = Object.values(procMap)
    .map((p) => ({
      ...p,
      ticketMedio: p.quantidade > 0 ? p.totalReceita / p.quantidade : 0,
      percentual: totalFaturamento > 0 ? (p.totalReceita / totalFaturamento) * 100 : 0,
    }))
    .sort((a, b) => b.totalReceita - a.totalReceita);

  // Convênios Agregados (apenas realizados)
  const convMap: Record<string, { nome: string; quantidade: number; totalReceita: number }> = {};
  for (const r of activeRows) {
    const nome = r.convenioNome || "Particular";
    if (!convMap[nome]) {
      convMap[nome] = { nome, quantidade: 0, totalReceita: 0 };
    }
    convMap[nome].quantidade += 1;
    convMap[nome].totalReceita += r.valorLiquido;
  }

  const distribuicaoConvenios: ConvenioAggregate[] = Object.values(convMap)
    .map((c) => ({
      ...c,
      percentual: totalFaturamento > 0 ? (c.totalReceita / totalFaturamento) * 100 : 0,
    }))
    .sort((a, b) => b.totalReceita - a.totalReceita);

  // Profissionais Agregados (apenas realizados)
  const profMap: Record<string, { nome: string; quantidade: number; totalReceita: number }> = {};
  for (const r of activeRows) {
    const nome = r.profissionalNome || "Não informado";
    if (!profMap[nome]) {
      profMap[nome] = { nome, quantidade: 0, totalReceita: 0 };
    }
    profMap[nome].quantidade += 1;
    profMap[nome].totalReceita += r.valorLiquido;
  }

  const distribuicaoProfissionais: ProfessionalAggregate[] = Object.values(profMap)
    .map((p) => ({
      ...p,
      percentual: totalFaturamento > 0 ? (p.totalReceita / totalFaturamento) * 100 : 0,
    }))
    .sort((a, b) => b.totalReceita - a.totalReceita);

  return {
    periodo,
    totalFaturamento,
    totalProcedimentos,
    totalAtendimentos: uniqueAppointments,
    ticketMedio,
    taxaConclusao,
    topProcedimentos,
    distribuicaoConvenios,
    distribuicaoProfissionais,
    rows,
  };
}
