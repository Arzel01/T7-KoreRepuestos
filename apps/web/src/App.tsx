import { BrowserRouter } from 'react-router-dom';

import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/features/auth/hooks/AuthContext';
import { CartProvider } from '@/features/cart/hooks/CartContext';
import { NotificationsProvider } from '@/features/notifications/hooks/NotificationsContext';
import { AppRouter } from '@/router/AppRouter';

/**
 * Raíz de la aplicación.
 *
 * Orden de providers:
 *   BrowserRouter        → habilita useNavigate / useLocation antes de cualquier consumidor.
 *   AuthProvider         → expone el contexto global de sesión.
 *   CartProvider         → carrito global (depende de AuthProvider para saber la sesión).
 *   NotificationsProvider → centro de notificaciones global (depende de AuthProvider);
 *                           otras features (p. ej. garage al actualizar kilometraje)
 *                           llaman su `reload()` para reflejar recordatorios al instante.
 *   AppRouter            → mapa de rutas declarativo.
 */
export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationsProvider>
            <AppRouter />
            <Toaster />
          </NotificationsProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
