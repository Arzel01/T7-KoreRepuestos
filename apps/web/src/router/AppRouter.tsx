import { UserRole } from '@kore/shared';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ProductCreatePage } from '@/features/products/pages/ProductCreatePage';
import { ProductsListPage } from '@/features/products/pages/ProductsListPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Mapa de rutas de la aplicación.
 *
 * Convenciones:
 *   · `/`                  → landing pública
 *   · `/auth/*`            → flujos no autenticados (login, registro)
 *   · `/admin/*`           → panel administrativo · requiere JWT + rol ADMIN
 *   · `*`                  → 404
 *
 * Las rutas protegidas se anidan dentro de `<ProtectedRoute>`. El componente
 * verifica autenticación + rol y redirige según corresponda. React Router v6
 * renderiza `<Outlet />` de la ruta padre como hijo.
 */
export function AppRouter(): JSX.Element {
  return (
    <Routes>
      {/* ── Públicas ───────────────────────────────────────────────────── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      {/* ── Privadas (admin) ───────────────────────────────────────────── */}
      <Route element={<ProtectedRoute requireRole={UserRole.ADMIN} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsListPage />} />
          <Route path="products/new" element={<ProductCreatePage />} />
          {/* Atajos no implementados → redirección al dashboard */}
          <Route path="categories" element={<Navigate to="/admin" replace />} />
          <Route path="users" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      {/* ── Catch-all 404 ──────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
