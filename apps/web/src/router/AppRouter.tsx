import { UserRole } from '@kore/shared';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';

const CatalogPage = lazy(() =>
  import('@/app/CatalogPage').then((m) => ({ default: m.CatalogPage })),
);
const LandingPage = lazy(() =>
  import('@/app/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const ProductDetailsPage = lazy(() =>
  import('@/app/ProductDetailsPage').then((m) => ({ default: m.ProductDetailsPage })),
);
const LoginPage = lazy(() =>
  import('@/app/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/app/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const GaragePage = lazy(() =>
  import('@/app/garage/GaragePage').then((m) => ({ default: m.GaragePage })),
);
const CalendarPage = lazy(() =>
  import('@/app/garage/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const DashboardPage = lazy(() =>
  import('@/app/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ProductsListPage = lazy(() =>
  import('@/app/admin/products/ProductsListPage').then((m) => ({ default: m.ProductsListPage })),
);
const ProductCreatePage = lazy(() =>
  import('@/app/admin/products/ProductCreatePage').then((m) => ({ default: m.ProductCreatePage })),
);
const ProductEditPage = lazy(() =>
  import('@/app/admin/products/ProductEditPage').then((m) => ({ default: m.ProductEditPage })),
);
const CategoriesPage = lazy(() =>
  import('@/app/admin/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const MaintenanceGuidesListPage = lazy(() =>
  import('@/app/admin/maintenance/MaintenanceGuidesListPage').then((m) => ({
    default: m.MaintenanceGuidesListPage,
  })),
);
const MaintenanceGuideNewPage = lazy(() =>
  import('@/app/admin/maintenance/MaintenanceGuideNewPage').then((m) => ({
    default: m.MaintenanceGuideNewPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/app/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export function AppRouter(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* ── Públicas ───────────────────────────────────────────────────── */}
        <Route path="/" element={<CatalogPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/catalog" element={<Navigate to="/" replace />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* ── Privadas (cualquier usuario autenticado) ──────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/garage" element={<GaragePage />} />
          <Route path="/garage/:vehicleId/calendar" element={<CalendarPage />} />
        </Route>

        {/* ── Privadas (admin) ───────────────────────────────────────────── */}
        <Route element={<ProtectedRoute requireRole={UserRole.ADMINISTRADOR} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsListPage />} />
            <Route path="products/new" element={<ProductCreatePage />} />
            <Route path="products/:id/edit" element={<ProductEditPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="maintenance" element={<MaintenanceGuidesListPage />} />
            <Route path="maintenance/new" element={<MaintenanceGuideNewPage />} />
            <Route path="users" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

        {/* ── Catch-all 404 ──────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
