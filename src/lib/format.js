import { parse, format, parseISO, isValid, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ISO_FMT = 'yyyy-MM-dd';
const BR_FMT = 'dd/MM/yyyy';

export function parseDateBR(str) {
  if (!str) return null;
  const cleaned = str.trim();
  const d = parse(cleaned, BR_FMT, new Date());
  return isValid(d) ? format(d, ISO_FMT) : null;
}

export function formatDateBR(iso) {
  if (!iso) return '-';
  const d = parseISO(iso);
  return isValid(d) ? format(d, BR_FMT) : '-';
}

export function todayISO() {
  return format(new Date(), ISO_FMT);
}

export function diasEntre(deISO, ateISO) {
  if (!deISO || !ateISO) return null;
  const de = parseISO(deISO);
  const ate = parseISO(ateISO);
  if (!isValid(de) || !isValid(ate)) return null;
  return differenceInCalendarDays(ate, de);
}

export function diaDaSemana(iso) {
  if (!iso) return '-';
  const d = parseISO(iso);
  if (!isValid(d)) return '-';
  const nome = format(d, 'EEEE', { locale: ptBR });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function formatNumero(n) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('pt-BR').format(n);
}
