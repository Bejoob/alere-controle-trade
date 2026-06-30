import { diasEntre, todayISO } from './format.js';

export const STATUS = {
  VENCIDO: 'Vencido',
  ALERTA: 'Alerta 50 dias',
  NORMAL: 'Normal',
  SEM_VALIDADE: 'Sem validade',
};

export const DIAS_ALERTA = 50;

export function calcularDiasParaVencer(validadeISO, referenciaISO = todayISO()) {
  if (!validadeISO) return null;
  return diasEntre(referenciaISO, validadeISO);
}

export function calcularStatusValidade(validadeISO, referenciaISO = todayISO()) {
  if (!validadeISO) return STATUS.SEM_VALIDADE;
  const dias = diasEntre(referenciaISO, validadeISO);
  if (dias === null) return STATUS.SEM_VALIDADE;
  if (dias < 0) return STATUS.VENCIDO;
  if (dias <= DIAS_ALERTA) return STATUS.ALERTA;
  return STATUS.NORMAL;
}

export function statusBadgeClass(status) {
  switch (status) {
    case STATUS.VENCIDO:
      return 'badge-red';
    case STATUS.ALERTA:
      return 'badge-yellow';
    case STATUS.NORMAL:
      return 'badge-green';
    default:
      return 'badge-gray';
  }
}
