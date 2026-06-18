import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { extractApiErrorMessage } from '@/lib/api-client';

import { useAuth } from '../hooks/AuthContext';

export function RegisterPage(): JSX.Element {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [touched, setTouched] = useState<Record<keyof typeof form, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirm: false,
  });
  const [error, setError] = useState<string | null>(null);

  const errors = {
    firstName: form.firstName.trim() ? null : 'Nombre obligatorio',
    lastName: form.lastName.trim() ? null : 'Apellido obligatorio',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? null : 'Email con formato inválido',
    phone:
      form.phone === '' || (form.phone.length >= 7 && form.phone.length <= 30)
        ? null
        : 'Teléfono entre 7 y 30 caracteres',
    password:
      form.password.length < 8
        ? 'Mínimo 8 caracteres'
        : !/[A-Z]/.test(form.password)
          ? 'Debe contener al menos una mayúscula'
          : !/\d/.test(form.password)
            ? 'Debe contener al menos un dígito'
            : null,
    confirm:
      form.confirm.length === 0
        ? 'Confirme su contraseña'
        : form.confirm !== form.password
          ? 'Las contraseñas no coinciden'
          : null,
  } as const;

  const isValid = (Object.values(errors) as Array<string | null>).every((v) => v === null);

  function update<K extends keyof typeof form>(key: K, value: string): void {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirm: true,
    });
    if (!isValid) return;
    setError(null);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  }

  return (
    <div className="storefront">
      <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <aside
          className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 lg:flex"
          aria-hidden="true"
        >
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
              Crea tu <br />
              <span className="text-white/70">cuenta</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/80">
              Accede al catálogo, gestiona tus cotizaciones y recibe alertas de mantenimiento a tu
              vehículo.
            </p>

            <div className="flex gap-3 border-t border-white/20 pt-6 text-sm text-white/60">
              <span>Catálogo completo</span>
              <span aria-hidden>·</span>
              <span>Soporte rápido</span>
              <span aria-hidden>·</span>
              <span>Acceso inmediato</span>
            </div>
          </div>

          <p className="relative text-xs text-white/40">© 2026 Kore Repuestos</p>
        </aside>

        <section className="flex items-center justify-center bg-background px-6 py-16 sm:px-12">
          <div className="w-full max-w-xl animate-fade-in-up">
            <Link
              to="/"
              className="mb-8 block text-2xl font-extrabold tracking-tight text-primary lg:hidden"
            >
              KORE <span className="text-sm font-normal text-muted-foreground">Repuestos</span>
            </Link>

            <h2 className="text-2xl font-bold tracking-tight text-foreground">Registro</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Completa tus datos para crear tu cuenta.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FieldText
                  id="firstName"
                  label="Nombre"
                  value={form.firstName}
                  onChange={(v) => update('firstName', v)}
                  onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                  error={touched.firstName ? errors.firstName : null}
                  autoComplete="given-name"
                  required
                />
                <FieldText
                  id="lastName"
                  label="Apellido"
                  value={form.lastName}
                  onChange={(v) => update('lastName', v)}
                  onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                  error={touched.lastName ? errors.lastName : null}
                  autoComplete="family-name"
                  required
                />
              </div>

              <FieldText
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => update('email', v)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                error={touched.email ? errors.email : null}
                autoComplete="email"
                required
              />

              <FieldText
                id="phone"
                label="Teléfono"
                type="tel"
                value={form.phone}
                onChange={(v) => update('phone', v)}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                error={touched.phone ? errors.phone : null}
                autoComplete="tel"
              />

              <FieldText
                id="password"
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={(v) => update('password', v)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                error={touched.password ? errors.password : null}
                autoComplete="new-password"
                hint="Mínimo 8 caracteres, 1 mayúscula y 1 dígito (número)."
                required
              />

              <FieldText
                id="confirm"
                label="Confirmar contraseña"
                type="password"
                value={form.confirm}
                onChange={(v) => update('confirm', v)}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                error={touched.confirm ? errors.confirm : null}
                autoComplete="new-password"
                required
              />

              {error && (
                <div
                  id="register-error"
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
                {isLoading ? 'Creando…' : 'Crear cuenta'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/auth/login" className="font-medium text-primary hover:underline">
                Iniciar sesión
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

interface FieldTextProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error: string | null;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}

function FieldText({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  required,
  hint,
}: FieldTextProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="h-10 w-full rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
