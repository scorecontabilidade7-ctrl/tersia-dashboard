export const STATUS_MAP: Record<number, { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info" }> = {
  1: { label: "Aguardando", variant: "warning" },
  2: { label: "Agendado", variant: "neutral" },
  3: { label: "Ausente", variant: "danger" },
  4: { label: "Cancelado", variant: "danger" },
  5: { label: "Confirmado", variant: "info" },
  6: { label: "Em atendimento", variant: "warning" },
  7: { label: "Finalizado", variant: "success" },
  8: { label: "Horário Bloqueado", variant: "neutral" },
  90: { label: "Cancelar Recorrência", variant: "danger" },
  100: { label: "Agendamento Online", variant: "info" },
  101: { label: "Finalizado Secretaria", variant: "success" },
  105: { label: "Pendente Doctoralia", variant: "warning" },
};

export const DRA_TERSIA_NAME_MATCH = "Térsia";

export function isTersiaProfessional(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return normalized.includes("tersia");
}

export function parseMoney(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export const FINALIZED_STATUS_IDS = [7, 101]; // 7: Finalizado pelo Médico, 101: Finalizado pela Secretaria

export function isTestAppointment(appt: {
  paciente_nome?: string | null;
  agenda_observacao?: string | null;
  agenda_cancelamento_justificativa?: string | null;
}): boolean {
  const check = (str?: string | null) => {
    if (!str) return false;
    const s = str.toUpperCase();
    return (
      s.includes("TESTE") ||
      s.includes("IGNORAR") ||
      s.includes("REGRESSAO") ||
      s.includes("FALLBACK") ||
      s.includes("VALIDACAO") ||
      s.includes("WF0")
    );
  };
  return (
    check(appt.paciente_nome) ||
    check(appt.agenda_observacao) ||
    check(appt.agenda_cancelamento_justificativa)
  );
}

