import { UserRole } from '@kore/shared';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { extractApiErrorMessage } from '@/lib/api-client';

import { useAuth } from '../hooks/AuthContext';

export function LoginPage(): JSX.Element {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState<string | null>(null);

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
      const destination = user.role === UserRole.ADMINISTRADOR ? redirectTo : '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  }

  return (
    <div className="storefront">
      <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        {/* ──────────────── Columna izquierda · Marca catálogo ──────────────── */}
        <aside
          className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 lg:flex"
          aria-hidden="true"
        >
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-white/10" />

          <div className="relative">
            <Link to="/" className="text-3xl font-extrabold tracking-tight text-white">
              KORE
              <span className="ml-2 text-base font-normal text-white/70">Repuestos</span>
            </Link>
          </div>

          <div className="relative space-y-6">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
              Tu tienda de <br />
              <span className="text-white/70">repuestos en línea</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/80">
              Miles de repuestos disponibles. Encuentra todo lo que necesitas para mantener tu
              vehículo en marcha.
            </p>

            <div className="flex gap-3 border-t border-white/20 pt-6 text-sm text-white/60">
              <span>Envíos a todo el país</span>
              <span aria-hidden>·</span>
              <span>Garantía de calidad</span>
              <span aria-hidden>·</span>
              <span>Soporte técnico</span>
            </div>
          </div>

          <p className="relative text-xs text-white/40">© 2026 Kore Repuestos</p>
        </aside>

        {/* ──────────────── Columna derecha · Formulario ──────────────── */}
        <section className="flex items-center justify-center bg-background px-6 py-16 sm:px-12">
          <div className="w-full max-w-md animate-fade-in-up">
            <Link
              to="/"
              className="mb-8 block text-2xl font-extrabold tracking-tight text-primary lg:hidden"
            >
              KORE <span className="text-sm font-normal text-muted-foreground">Repuestos</span>
            </Link>

            <h2 className="text-2xl font-bold tracking-tight text-foreground">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Accede con tu cuenta para gestionar el catálogo.
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 space-y-5"
              aria-describedby={error ? 'login-error' : undefined}
            >
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
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
                  className="h-10 w-full rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="vos@empresa.com"
                />
                {emailError && (
                  <p id="email-error" role="alert" className="text-xs text-destructive">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Contraseña
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
                  className="h-10 w-full rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
                {passwordError && (
                  <p id="password-error" role="alert" className="text-xs text-destructive">
                    {passwordError}
                  </p>
                )}
              </div>

              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isValid}
                className="mt-2 h-10 w-full rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Verificando…' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/auth/register" className="font-medium text-primary hover:underline">
                Registrate
              </Link>
            </p>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/" className="hover:underline">
                ← Volver al catálogo
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
