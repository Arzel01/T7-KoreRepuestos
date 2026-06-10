# Estrategia de Ramificación — GitFlow

Adoptamos **GitFlow** como modelo de ramificación porque encaja con releases
planificados, hotfixes controlados y revisión obligatoria por PR. Esta guía es
la fuente de verdad para todo el equipo de Kore Repuestos.

---

## 1. Ramas permanentes

| Rama      | Propósito                                                                   | Despliegue a |
| --------- | --------------------------------------------------------------------------- | ------------ |
| `main`    | Código en producción. Cada commit aquí es una **release etiquetada**.       | Producción   |
| `develop` | Línea base de integración. Acumula features listas para el próximo release. | Staging      |

Reglas:

- **Nadie** hace push directo a `main` ni a `develop`. Ambas exigen Pull
  Request.
- `main` solo recibe merges desde `release/*` o `hotfix/*`.
- Cada merge a `main` se etiqueta con `vX.Y.Z` (SemVer).

---

## 2. Ramas de trabajo (efímeras)

### 2.1 `feature/*` — nueva funcionalidad

```
Nace de:   develop
Muere en:  develop (vía PR)
Naming:    feature/<ticket-id>-<descripcion-corta-kebab>
Ejemplo:   feature/KORE-142-calculo-plan-mantenimiento
```

### 2.2 `release/*` — preparación de release

```
Nace de:   develop
Muere en:  main + develop
Naming:    release/<version>
Ejemplo:   release/1.3.0
```

En esta rama solo se permiten: bump de versión, fixes menores de QA,
actualización de changelog. **No se desarrollan features nuevos aquí.**

### 2.3 `hotfix/*` — corrección urgente sobre producción

```
Nace de:   main
Muere en:  main + develop
Naming:    hotfix/<version>-<descripcion>
Ejemplo:   hotfix/1.2.1-error-login-asesor
```

### 2.4 `bugfix/*` — corrección de bug detectado en develop

```
Nace de:   develop
Muere en:  develop
Naming:    bugfix/<ticket-id>-<descripcion>
Ejemplo:   bugfix/KORE-203-validacion-vin-incorrecta
```

### 2.5 `chore/*` y `docs/*` — tareas que no son producto

```
Naming:    chore/<descripcion>   |   docs/<descripcion>
Ejemplo:   chore/actualizar-deps-q2 | docs/onboarding-equipo
```

---

## 3. Flujo visual

```
main      ─────●──────────────────────────●──────────────●─────────►
                \                        /                \
                 \                      /                  hotfix/1.2.1
                  \                    /                   /
release/1.2.0      ─────────●─────────●                   /
                            ^         \                  /
                            |          \                /
develop   ──●───●───●───●───●───●───●───●───●───●───●──●───►
              \       \       /           \       /
   feature/a   ●───────●     /             \     /
                            /               \   /
   feature/b   ────────────●                 \ /
                                              ●
                                       hotfix back-merge
```

---

## 4. Reglas de Pull Request

1. **PR base correcto**: features → `develop`, hotfixes → `main`.
2. **Mínimo 1 reviewer** aprobando antes de mergear (2 si toca pagos/BD).
3. **CI verde obligatorio**: lint, tests, build deben pasar.
4. **Squash merge** para `feature/*` y `bugfix/*` (historial limpio). **Merge
   commit** para `release/*` y `hotfix/*` (preserva trazabilidad).
5. **Eliminar la rama** tras mergear.
6. El título del PR sigue **Conventional Commits** (ver
   [CONVENTIONAL_COMMITS.md](./CONVENTIONAL_COMMITS.md)).

---

## 5. Comandos de referencia rápida

```bash
# Iniciar un feature
git checkout develop
git pull --rebase origin develop
git checkout -b feature/KORE-142-calculo-plan-mantenimiento

# Mantenerse al día con develop
git fetch origin
git rebase origin/develop

# Iniciar un release
git checkout develop && git pull
git checkout -b release/1.3.0
# ... bump version, changelog ...
# PR → main, luego back-merge a develop, tag v1.3.0

# Hotfix
git checkout main && git pull
git checkout -b hotfix/1.2.1-error-login-asesor
# ... fix ...
# PR → main (tag v1.2.1) y back-merge a develop
```

---

## 6. Protección de ramas (configurar en GitHub/GitLab)

| Rama        | Push directo | PR requerido | Aprobaciones | CI obligatorio |
| ----------- | :----------: | :----------: | :----------: | :------------: |
| `main`      |      ❌      |      ✅      |      2       |       ✅       |
| `develop`   |      ❌      |      ✅      |      1       |       ✅       |
| `release/*` |      ❌      |      ✅      |      1       |       ✅       |

---

## 7. Tags y versionado (SemVer)

`MAJOR.MINOR.PATCH` — por ejemplo `v1.3.0`.

- **MAJOR**: cambios incompatibles en la API pública o el contrato de datos.
- **MINOR**: nuevas features compatibles hacia atrás.
- **PATCH**: fixes compatibles hacia atrás.

Cada release se etiqueta automáticamente al mergear `release/*` o `hotfix/*` a
`main`.
