import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/features/auth/hooks/AuthContext';
import { CartProvider } from '@/features/cart/hooks/CartContext';
import { AppRouter } from '@/router/AppRouter';

/**
 * Raíz de la aplicación.
 *
 * Orden de providers:
 *   BrowserRouter  → habilita useNavigate / useLocation antes de cualquier consumidor.
 *   AuthProvider   → expone el contexto global de sesión.
 *   CartProvider   → carrito global (depende de AuthProvider para saber la sesión).
 *   AppRouter      → mapa de rutas declarativo.
 */
export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
