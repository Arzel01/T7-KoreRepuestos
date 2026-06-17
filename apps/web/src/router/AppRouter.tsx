import { UserRole } from '@kore/shared';
import { Navigate, Route, Routes } from 'react-router-dom';

import { CategoriesPage } from '@/app/admin/CategoriesPage';
import { DashboardPage } from '@/app/admin/DashboardPage';
import { ProductCreatePage } from '@/app/admin/products/ProductCreatePage';
import { ProductEditPage } from '@/app/admin/products/ProductEditPage';
import { ProductsListPage } from '@/app/admin/products/ProductsListPage';
import { LoginPage } from '@/app/auth/LoginPage';
import { RegisterPage } from '@/app/auth/RegisterPage';
import { CatalogPage } from '@/app/CatalogPage';
import { NotFoundPage } from '@/app/NotFoundPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';

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
          <Route path="products/:id/edit" element={<ProductEditPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="users" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      {/* ── Catch-all 404 ──────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
