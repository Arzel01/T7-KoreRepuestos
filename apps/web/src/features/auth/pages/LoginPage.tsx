import { UserRole } from '@kore/shared';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { extractApiErrorMessage } from '@/lib/api-client';

import { useAuth } from '../AuthContext';

/**
 * Página de Login — US-Auth.
 *
 * Composición editorial: división 50/50 entre columna informativa
 * (eyebrow + display tipográfico) y formulario técnico minimalista.
 *
 * Validación cliente:
 *   · email no vacío + formato válido
 *   · password no vacío
 *
 * La validación real ocurre en el backend; aquí prevenimos roundtrips
 * obvios y damos feedback inmediato.
 */
export function LoginPage(): JSX.Element {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState<string | null>(null);

  // -------------------------- Validación cliente ----------------------------
  const emailError =
    touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Email con formato inválido'
      : null;
  const passwordError = touched.password && password.length === 0 ? 'Ingrese su contraseña' : null;
  const isValid = !emailError && !passwordError && email && password;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setError(null);
    try {
      const user = await login({ email, password });
      const destination = user.role === UserRole.ADMIN ? redirectTo : '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* ──────────────── Columna izquierda · Editorial ──────────────── */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 lg:flex"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-tech-grid bg-tech-grid opacity-[0.12]" />
        <div className="absolute right-0 top-0 h-3 w-1/3 bg-hazard-stripes" />

        <div className="relative">
          <p className="eyebrow">Kore · Sistema interno</p>
          <p className="mt-2 font-mono text-xs text-ink-500">ID-001 · CONTROL DE ACCESO</p>
        </div>

        <div className="relative space-y-8">
          <h1 className="display text-display-lg text-balance">
            <span className="block">Repuestos</span>
            <span className="block text-signal-500">en su sitio.</span>
          </h1>
          <p className="max-w-md font-sans text-base leading-relaxed text-ink-300">
            Plataforma operacional para distribuidores. Catálogo, planes de mantenimiento y
            cotizaciones — todo en un solo lugar.
          </p>

          <dl className="grid grid-cols-3 border-t border-ink-700 pt-6 font-mono text-xs uppercase tracking-wider">
            <div>
              <dt className="text-ink-500">Stack</dt>
              <dd className="mt-1 text-ink-100">NestJS · React</dd>
            </div>
            <div>
              <dt className="text-ink-500">Sprint</dt>
              <dd className="mt-1 text-ink-100">01 / 06</dd>
            </div>
            <div>
              <dt className="text-ink-500">Versión</dt>
              <dd className="mt-1 text-ink-100">0.1.0</dd>
            </div>
          </dl>
        </div>

        <p className="relative font-mono text-[10px] uppercase tracking-eyebrow text-ink-500">
          © 2026 Kore · Acceso restringido a personal autorizado.
        </p>
      </aside>

      {/* ──────────────── Columna derecha · Formulario ──────────────── */}
      <section className="flex items-center justify-center bg-ink-950 px-6 py-16 sm:px-12">
        <div className="w-full max-w-md animate-fade-in-up">
          <p className="eyebrow">Operación · 01</p>
          <h2 className="display mt-3 text-display-md">Iniciar sesión</h2>
          <p className="mt-3 font-sans text-sm text-ink-400">
            Acceda con sus credenciales corporativas para gestionar el catálogo.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-12 space-y-8"
            aria-describedby={error ? 'login-error' : undefined}
          >
            {/* --- Email --- */}
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-eyebrow uppercase tracking-eyebrow text-ink-400"
              >
                <span className="mr-2 text-signal-500">01 →</span>Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className="input-technical mt-3"
                placeholder="usted@empresa.com"
              />
              {emailError && (
                <p id="email-error" role="alert" className="mt-2 font-mono text-xs text-danger-500">
                  ✕ {emailError}
                </p>
              )}
            </div>

            {/* --- Password --- */}
            <div>
              <label
                htmlFor="password"
                className="block font-mono text-eyebrow uppercase tracking-eyebrow text-ink-400"
              >
                <span className="mr-2 text-signal-500">02 →</span>Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className="input-technical mt-3"
                placeholder="••••••••"
              />
              {passwordError && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-2 font-mono text-xs text-danger-500"
                >
                  ✕ {passwordError}
                </p>
              )}
            </div>

            {/* --- Error global del backend --- */}
            {error && (
              <div
                id="login-error"
                role="alert"
                className="border-l-2 border-danger-500 bg-danger-700/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-danger-500"
              >
                ✕ {error}
              </div>
            )}

            <button type="submit" disabled={isLoading || !isValid} className="btn-primary w-full">
              {isLoading ? 'Verificando…' : 'Entrar'}
              <span aria-hidden>→</span>
            </button>
          </form>

          <p className="mt-10 font-mono text-xs text-ink-500">
            ¿Aún no tiene cuenta?{' '}
            <Link to="/auth/register" className="text-signal-500 hover:underline">
              Crear cuenta nueva
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
