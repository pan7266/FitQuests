interface RecordCardProps {
  label: string;
  value: string;
  detail?: string;
}

export function RecordCard({ label, value, detail }: RecordCardProps) {
  return (
    <article className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-inset)] p-4">
      <p className="text-app-muted text-xs font-bold uppercase tracking-[0.16em]">{label}</p>
      <p className="text-app mt-2 text-2xl font-black">{value}</p>
      {detail ? <p className="text-app-muted mt-1 text-sm">{detail}</p> : null}
    </article>
  );
}
