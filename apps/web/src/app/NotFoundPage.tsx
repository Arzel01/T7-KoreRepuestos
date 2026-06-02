import { Link } from 'react-router-dom';

export function NotFoundPage(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-display-lg">
        <span className="text-signal-500">Pieza</span> no encontrada
      </h1>
      <p className="mt-4 max-w-md font-sans text-base text-ink-400">
        La URL solicitada no existe o fue movida. Verifique la dirección.
      </p>
      <Link to="/" className="btn-primary mt-10">
        ← Volver al inicio
      </Link>
    </main>
  );
}
