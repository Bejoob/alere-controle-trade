import { statusBadgeClass } from '../lib/status.js';

export default function Badge({ status, children }) {
  return <span className={statusBadgeClass(status)}>{children ?? status}</span>;
}
