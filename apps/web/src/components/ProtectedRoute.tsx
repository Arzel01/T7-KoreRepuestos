import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/AuthContext';

import type { UserRole } from '@kore/shared';

export function ProtectedRoute({ requireRole }: { requireRole?: UserRole }): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }
  if (requireRole && user?.role !== requireRole) {
    return <ForbiddenScreen />;
  }
  return <Outlet />;
}

function ForbiddenScreen(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 py-12">
      <p className="eyebrow">403 · Forbidden</p>
      <h1 className="display mt-4 text-display-md text-signal-500">Acceso denegado</h1>
      <p className="mt-4 max-w-md text-center font-sans text-base text-ink-400">
        No tiene permisos para ingresar a esta sección. Esta zona está reservada para personal
        administrativo.
      </p>
    </main>
  );
}
