interface ResultsHeaderProps {
  total: number | null;
  loading: boolean;
}

export function ResultsHeader({ total, loading }: ResultsHeaderProps): JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-lg font-semibold" aria-live="polite">
        {loading || total === null ? 'Buscando…' : `${total} Productos encontrados`}
      </h2>
    </div>
  );
}
