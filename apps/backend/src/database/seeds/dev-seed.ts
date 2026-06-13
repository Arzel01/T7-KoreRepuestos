/**
 * Seed de DESARROLLO para el schema real (tablas en español).
 *
 * Idempotente — inserta solo si el nombre/sku no existe todavía.
 * No depende de UNIQUE en categorias.nombre (el schema real no lo tiene).
 *
 * Uso: pnpm --filter @kore/backend seed:dev
 */
import dataSource from '../../config/typeorm.config';

async function upsertCategoria(nombre: string): Promise<number> {
  const existing = await dataSource.query<Array<{ id_categoria: number }>>(
    `SELECT id_categoria FROM categorias WHERE nombre = $1 LIMIT 1`,
    [nombre],
  );
  if (existing.length > 0) return existing[0].id_categoria;

  const [row] = await dataSource.query<Array<{ id_categoria: number }>>(
    `INSERT INTO categorias (nombre) VALUES ($1) RETURNING id_categoria`,
    [nombre],
  );
  return row.id_categoria;
}

async function main(): Promise<void> {
  await dataSource.initialize();

  // ── Categorías ──────────────────────────────────────────────────────────
  const filtros = await upsertCategoria('Filtros');
  const frenos = await upsertCategoria('Frenos');
  const suspension = await upsertCategoria('Suspensión');
  const lubricantes = await upsertCategoria('Lubricantes');

  // ── Productos ───────────────────────────────────────────────────────────
  await dataSource.query(
    `INSERT INTO productos (sku, nombre, descripcion, precio_base, stock_actual, id_categoria, is_active) VALUES
       ('HYK-OF-2631', 'Filtro de Aceite Premium',    'Filtro de aceite de alta eficiencia. Compatible con motores 1.4–2.0L.',        12.99,  45, $1, TRUE),
       ('HYK-AF-5521', 'Filtro de Aire Motor',        'Filtro de aire de papel de alta filtración. Retiene partículas >10 µm.',        8.50,  30, $1, TRUE),
       ('HYK-FF-1122', 'Filtro de Combustible',       'Filtro de combustible para sistemas GDI y PFI.',                                15.00,  20, $1, TRUE),
       ('BRK-PP-4481', 'Pastillas de Freno Delantero','Pastillas semimetálicas de bajo polvo para vehículos compactos.',               32.00,   8, $2, TRUE),
       ('BRK-RR-3391', 'Rotor de Freno',              'Disco ventilado de 280 mm. Par de descuento aplicado.',                        89.00,   5, $2, TRUE),
       ('BRK-FC-0012', 'Líquido de Frenos DOT 4',     'Líquido DOT 4 de alta temperatura. Frasco 500 ml.',                            11.50,  60, $2, TRUE),
       ('SUS-SH-7721', 'Amortiguador Delantero',      'Amortiguador de gas de doble tubo. Unitario.',                                 75.00,   0, $3, TRUE),
       ('SUS-SP-3301', 'Espiral de Suspensión',        'Resorte de suspensión delantera. Par.',                                        48.00,  12, $3, TRUE),
       ('LUB-ME-5W30', 'Aceite Motor 5W-30 Sintético', 'Aceite de motor sintético 100%. Galón 4L.',                                    38.99,  25, $4, TRUE),
       ('LUB-AT-DEXT', 'Aceite Transmisión ATF',      'Fluido para transmisión automática DEXRON III/MERCON. 1L.',                    22.00,  18, $4, TRUE),
       ('LUB-GR-MULTI','Grasa Multipropósito',        'Grasa de litio para engranajes, rodamientos y piezas de fricción. 500g.',       9.99,  35, $4, TRUE),
       ('BRK-CB-0081', 'Cable de Freno de Mano',      'Cable trasero para freno de mano. Par.',                                       18.50,   0, $2, TRUE)
     ON CONFLICT (sku) DO NOTHING`,
    [filtros, frenos, suspension, lubricantes],
  );

  console.info('✓ Seed completado: 4 categorías + 12 productos');
  await dataSource.destroy();
}

main().catch((e) => {
  console.error('Seed falló:', e);
  process.exit(1);
});
