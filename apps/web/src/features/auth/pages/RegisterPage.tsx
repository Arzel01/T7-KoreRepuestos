import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { extractApiErrorMessage } from '@/lib/api-client';

import { useAuth } from '../AuthContext';

/**
 * Página de Registro — US-Auth.
 *
 * Validación cliente sincronizada con el DTO `CreateUserDto` del backend:
 *   · email           formato válido
 *   · password        ≥ 8 chars, ≥ 1 mayúscula, ≥ 1 dígito
 *   · firstName/lastName no vacíos
 *   · phone           opcional (7-30 chars si se completa)
 *
 * El backend repite la validación con `class-validator` — el cliente es
 * UX, no la fuente de verdad de las reglas.
 */
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

  // --- Validadores puros (testables en aislamiento) -------------------------
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
    <main className="min-h-screen bg-ink-950 px-6 py-16 sm:px-12">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-16 lg:grid-cols-[1fr_1.2fr]">
        {/* ---------- Columna informativa ---------- */}
        <aside className="space-y-8">
          <p className="eyebrow">Kore · Alta de usuario</p>
          <h1 className="display text-display-lg text-balance">
            Cree su <span className="text-signal-500">cuenta</span>.
          </h1>
          <p className="max-w-md font-sans text-base leading-relaxed text-ink-300">
            Acceda al catálogo, gestione sus cotizaciones y reciba alertas de stock bajo. Toma menos
            de un minuto.
          </p>

          <ul className="space-y-3 border-l-2 border-signal-500 pl-5 font-mono text-xs uppercase tracking-wider text-ink-300">
            <li>↳ 01 · Datos personales</li>
            <li>↳ 02 · Credenciales</li>
            <li>↳ 03 · Activación inmediata</li>
          </ul>
        </aside>

        {/* ---------- Formulario ---------- */}
        <section className="panel p-8 lg:p-10">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FieldText
                id="firstName"
                label="Nombre"
                step="01"
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
                step="02"
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
              label="Email corporativo"
              step="03"
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
              label="Teléfono (opcional)"
              step="04"
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
              step="05"
              type="password"
              value={form.password}
              onChange={(v) => update('password', v)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              error={touched.password ? errors.password : null}
              autoComplete="new-password"
              hint="Mínimo 8 caracteres, 1 mayúscula y 1 dígito."
              required
            />

            <FieldText
              id="confirm"
              label="Confirmar contraseña"
              step="06"
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
                role="alert"
                className="border-l-2 border-danger-500 bg-danger-700/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-danger-500"
              >
                ✕ {error}
              </div>
            )}

            <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/auth/login"
                className="font-mono text-xs uppercase tracking-wider text-ink-400 hover:text-signal-500"
              >
                ← Ya tengo cuenta
              </Link>
              <button type="submit" disabled={isLoading || !isValid} className="btn-primary">
                {isLoading ? 'Creando…' : 'Crear cuenta'}
                <span aria-hidden>→</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// FieldText — átomo reutilizable del formulario
// ---------------------------------------------------------------------------
interface FieldTextProps {
  id: string;
  label: string;
  step: string;
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
  step,
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
    <div>
      <label
        htmlFor={id}
        className="block font-mono text-eyebrow uppercase tracking-eyebrow text-ink-400"
      >
        <span className="mr-2 text-signal-500">{step} →</span>
        {label}
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
        className="input-technical mt-3"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 font-mono text-xs text-danger-500">
          ✕ {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 font-mono text-[11px] text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
