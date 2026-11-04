import { KIND_LABEL, SHIFT_LABEL, STATUS_LABEL, type Kind, type Shift, type Status } from "@/lib/rules";

export function ShiftPill({ shift }: { shift: Shift }) {
  return <span className={`pill pill-${shift}`}>{SHIFT_LABEL[shift]}</span>;
}
export function KindPill({ kind }: { kind: Kind }) {
  return <span className={`pill pill-${kind}`}>{KIND_LABEL[kind]}</span>;
}
export function StatusPill({ status }: { status: Status }) {
  return <span className={`pill pill-${status}`}>{STATUS_LABEL[status]}</span>;
}
