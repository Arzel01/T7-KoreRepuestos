import { UserRole } from '@kore/shared';
import { Navigate, Route, Routes } from 'react-router-dom';

import { CategoriesPage } from '@/app/admin/CategoriesPage';
import { DashboardPage } from '@/app/admin/DashboardPage';
import { MaintenanceGuideNewPage } from '@/app/admin/maintenance/MaintenanceGuideNewPage';
import { MaintenanceGuidesListPage } from '@/app/admin/maintenance/MaintenanceGuidesListPage';
import { ProductCreatePage } from '@/app/admin/products/ProductCreatePage';
import { ProductEditPage } from '@/app/admin/products/ProductEditPage';
import { ProductsListPage } from '@/app/admin/products/ProductsListPage';
import { QuotationsAdminListPage } from '@/app/admin/QuotationsListPage';
import { LoginPage } from '@/app/auth/LoginPage';
import { RegisterPage } from '@/app/auth/RegisterPage';
import { CatalogPage } from '@/app/CatalogPage';
import { CalendarPage } from '@/app/garage/CalendarPage';
import { DashboardPage as MaintenanceDashboardPage } from '@/app/garage/DashboardPage';
import { GaragePage } from '@/app/garage/GaragePage';
import { LandingPage } from '@/app/LandingPage';
import { NotFoundPage } from '@/app/NotFoundPage';
import { ProductDetailsPage } from '@/app/ProductDetailsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SearchAnalyticsPage } from '@/features/analytics/components/SearchAnalyticsPage';
import { CartPage } from '@/features/cart/components/CartPage';
import { CartSummaryPage } from '@/features/quotations/components/CartSummaryPage';
import { QuotationPreviewPage } from '@/features/quotations/components/QuotationPreviewPage';
import { AdvancedSearchPage } from '@/features/search/components/AdvancedSearchPage';
import { AdminLayout } from '@/layouts/AdminLayout';

export function AppRouter(): JSX.Element {
  return (
    <Routes>
      {/* ── Públicas ───────────────────────────────────────────────────── */}
      <Route path="/" element={<CatalogPage />} />
      <Route path="/search" element={<AdvancedSearchPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/catalog" element={<Navigate to="/" replace />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      {/* ── Privadas (cualquier usuario autenticado) ──────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/cart/summary" element={<CartSummaryPage />} />
        <Route path="/quotations/:id" element={<QuotationPreviewPage />} />
        <Route path="/garage" element={<GaragePage />} />
        <Route path="/garage/dashboard" element={<MaintenanceDashboardPage />} />
        <Route path="/garage/:vehicleId/calendar" element={<CalendarPage />} />
      </Route>

      {/* ── Privadas (admin + asesor comercial) ─────────────────────────
          Ambos roles entran al panel (dashboard + cotizaciones); las rutas
          de gestión del catálogo quedan admin-only vía Sidebar (UX) y el
          backend (@Roles) sigue siendo el límite real de autorización. ── */}
      <Route
        element={
          <ProtectedRoute requireRole={[UserRole.ADMINISTRADOR, UserRole.ASESOR_COMERCIAL]} />
        }
      >
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="quotations" element={<QuotationsAdminListPage />} />
          <Route path="products" element={<ProductsListPage />} />
          <Route path="products/new" element={<ProductCreatePage />} />
          <Route path="products/:id/edit" element={<ProductEditPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="maintenance" element={<MaintenanceGuidesListPage />} />
          <Route path="maintenance/new" element={<MaintenanceGuideNewPage />} />
          <Route path="analytics" element={<SearchAnalyticsPage />} />
          <Route path="users" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      {/* ── Catch-all 404 ──────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
