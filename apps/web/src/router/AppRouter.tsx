import { UserRole } from '@kore/shared';
import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/app/admin/DashboardPage';
import { ProductCreatePage } from '@/app/admin/products/ProductCreatePage';
import { ProductsListPage } from '@/app/admin/products/ProductsListPage';
import { LoginPage } from '@/app/auth/LoginPage';
import { RegisterPage } from '@/app/auth/RegisterPage';
import { CatalogPage } from '@/app/CatalogPage';
import { NotFoundPage } from '@/app/NotFoundPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';

/**
 * Mapa de rutas de la aplicación.
 *
 * Convenciones:
 *   · `/`                  → catálogo público (storefront)
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
      <Route path="/" element={<CatalogPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      {/* ── Privadas (admin) ───────────────────────────────────────────── */}
      <Route element={<ProtectedRoute requireRole={UserRole.ADMINISTRADOR} />}>
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
