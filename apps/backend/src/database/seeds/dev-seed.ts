/**
 * Seed de DESARROLLO para el schema real (tablas en español).
 *
 * Idempotente — usa ON CONFLICT DO NOTHING en todos los INSERT.
 * Cubre: usuarios, marcas, modelos, categorias, productos, fichas_tecnicas,
 *        compatibilidades, vehiculos_usuario, guias_mantenimiento,
 *        tareas_mantenimiento, productos_tarea, historial_mantenimiento.
 *
 * Credenciales de prueba:
 *   admin@kore.dev      / Admin1234
 *   asesor@kore.dev     / Asesor1234
 *   cliente1@kore.dev   / Cliente1234
 *   cliente2@kore.dev   / Cliente1234
 *   cliente3@kore.dev   / Cliente1234
 *
 * Uso: pnpm --filter @kore/backend seed:dev
 */
import * as bcrypt from 'bcrypt';

import dataSource from '../../config/typeorm.config';

const BCRYPT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function upsertMarca(nombre: string): Promise<number> {
  await dataSource.query(
    `INSERT INTO marcas (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`,
    [nombre],
  );
  const [row] = await dataSource.query<Array<{ id_marca: number }>>(
    `SELECT id_marca FROM marcas WHERE nombre = $1`,
    [nombre],
  );
  return row.id_marca;
}

async function upsertCategoria(nombre: string, padreId?: number): Promise<number> {
  const existing = await dataSource.query<Array<{ id_categoria: number }>>(
    `SELECT id_categoria FROM categorias WHERE nombre = $1 AND ($2::int IS NULL AND id_categoria_padre IS NULL OR id_categoria_padre = $2) LIMIT 1`,
    [nombre, padreId ?? null],
  );
  if (existing.length > 0) return existing[0].id_categoria;

  const [row] = await dataSource.query<Array<{ id_categoria: number }>>(
    `INSERT INTO categorias (nombre, id_categoria_padre) VALUES ($1, $2) RETURNING id_categoria`,
    [nombre, padreId ?? null],
  );
  return row.id_categoria;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await dataSource.initialize();

  // ── 1. Usuarios ───────────────────────────────────────────────────────────
  const passwordCliente = await bcrypt.hash('Cliente1234', BCRYPT_ROUNDS);
  const passwordAdmin = await bcrypt.hash('Admin1234', BCRYPT_ROUNDS);
  const passwordAsesor = await bcrypt.hash('Asesor1234', BCRYPT_ROUNDS);

  await dataSource.query(
    `INSERT INTO usuarios (email, password_hash, nombres, rol, is_active) VALUES
       ('admin@kore.dev',    $1, 'Administrador Kore',   'Administrador',     TRUE),
       ('asesor@kore.dev',   $2, 'Carlos Mendoza',       'Asesor Comercial',  TRUE),
       ('cliente1@kore.dev', $3, 'María García',         'Cliente',           TRUE),
       ('cliente2@kore.dev', $3, 'Juan Pérez',           'Cliente',           TRUE),
       ('cliente3@kore.dev', $3, 'Ana Rodríguez',        'Cliente',           TRUE)
     ON CONFLICT (email) DO NOTHING`,
    [passwordAdmin, passwordAsesor, passwordCliente],
  );

  const usuarios = await dataSource.query<Array<{ id_usuario: number; email: string }>>(
    `SELECT id_usuario, email FROM usuarios WHERE email IN ($1,$2,$3,$4,$5)`,
    [
      'admin@kore.dev',
      'asesor@kore.dev',
      'cliente1@kore.dev',
      'cliente2@kore.dev',
      'cliente3@kore.dev',
    ],
  );
  const byEmail = Object.fromEntries(usuarios.map((u) => [u.email, u.id_usuario]));

  const idCliente1 = byEmail['cliente1@kore.dev'];
  const idCliente2 = byEmail['cliente2@kore.dev'];
  const idCliente3 = byEmail['cliente3@kore.dev'];

  console.info('✓ Usuarios: 5 registros');

  // ── 2. Marcas ─────────────────────────────────────────────────────────────
  const [idToyota, idHyundai, idKia, idChevrolet, idNissan] = await Promise.all([
    upsertMarca('Toyota'),
    upsertMarca('Hyundai'),
    upsertMarca('Kia'),
    upsertMarca('Chevrolet'),
    upsertMarca('Nissan'),
  ]);

  console.info('✓ Marcas: 5 registros');

  // ── 3. Modelos ────────────────────────────────────────────────────────────
  await dataSource.query(
    `INSERT INTO modelos (id_marca, nombre, anio_inicio, anio_fin) VALUES
       ($1, 'Corolla',    2015, 2023),
       ($1, 'Hilux',      2016, 2024),
       ($1, 'RAV4',       2019, 2024),
       ($2, 'Elantra',    2017, 2023),
       ($2, 'Tucson',     2018, 2024),
       ($2, 'Santa Fe',   2019, 2024),
       ($3, 'Rio',        2016, 2022),
       ($3, 'Sportage',   2017, 2024),
       ($3, 'Seltos',     2020, 2024),
       ($4, 'Sail',       2015, 2021),
       ($4, 'Captiva',    2018, 2023),
       ($5, 'Sentra',     2015, 2022),
       ($5, 'X-Trail',    2017, 2023)
     ON CONFLICT DO NOTHING`,
    [idToyota, idHyundai, idKia, idChevrolet, idNissan],
  );

  const modelos = await dataSource.query<Array<{ id_modelo: number; nombre: string }>>(
    `SELECT id_modelo, nombre FROM modelos`,
  );
  const modeloByNombre = Object.fromEntries(modelos.map((m) => [m.nombre, m.id_modelo]));

  console.info(`✓ Modelos: ${modelos.length} registros`);

  // ── 4. Categorías de productos ────────────────────────────────────────────
  const filtros = await upsertCategoria('Filtros');
  const frenos = await upsertCategoria('Frenos');
  const suspension = await upsertCategoria('Suspensión');
  const lubricantes = await upsertCategoria('Lubricantes');
  const electrico = await upsertCategoria('Eléctrico');
  const motor = await upsertCategoria('Motor');

  // Subcategorías
  await upsertCategoria('Filtros de Aceite', filtros);
  await upsertCategoria('Filtros de Aire', filtros);
  await upsertCategoria('Filtros de Combustible', filtros);
  await upsertCategoria('Pastillas de Freno', frenos);
  await upsertCategoria('Discos de Freno', frenos);
  await upsertCategoria('Amortiguadores', suspension);
  await upsertCategoria('Resortes', suspension);

  console.info('✓ Categorías: 6 raíz + 7 subcategorías');

  // ── 5. Productos ──────────────────────────────────────────────────────────
  await dataSource.query(
    `INSERT INTO productos (sku, nombre, descripcion, precio_base, stock_actual, id_categoria, is_active) VALUES
       ('HYK-OF-2631', 'Filtro de Aceite Premium',       'Filtro de aceite de alta eficiencia. Compatible con motores 1.4–2.0L.',         12.99,  45, $1, TRUE),
       ('HYK-AF-5521', 'Filtro de Aire Motor',           'Filtro de aire de papel de alta filtración. Retiene partículas >10 µm.',          8.50,  30, $1, TRUE),
       ('HYK-FF-1122', 'Filtro de Combustible',          'Filtro de combustible para sistemas GDI y PFI.',                                  15.00,  20, $1, TRUE),
       ('BRK-PP-4481', 'Pastillas de Freno Delantero',   'Pastillas semimetálicas de bajo polvo para vehículos compactos.',                 32.00,   8, $2, TRUE),
       ('BRK-RR-3391', 'Rotor de Freno',                 'Disco ventilado de 280 mm.',                                                      89.00,   5, $2, TRUE),
       ('BRK-FC-0012', 'Líquido de Frenos DOT 4',        'Líquido DOT 4 de alta temperatura. Frasco 500 ml.',                              11.50,  60, $2, TRUE),
       ('SUS-SH-7721', 'Amortiguador Delantero',         'Amortiguador de gas de doble tubo. Unitario.',                                    75.00,   0, $3, TRUE),
       ('SUS-SP-3301', 'Espiral de Suspensión',           'Resorte de suspensión delantera. Par.',                                           48.00,  12, $3, TRUE),
       ('LUB-ME-5W30', 'Aceite Motor 5W-30 Sintético',   'Aceite de motor sintético 100%. Galón 4L.',                                       38.99,  25, $4, TRUE),
       ('LUB-AT-DEXT', 'Aceite Transmisión ATF',         'Fluido para transmisión automática DEXRON III/MERCON. 1L.',                       22.00,  18, $4, TRUE),
       ('LUB-GR-MULTI','Grasa Multipropósito',           'Grasa de litio para rodamientos y piezas de fricción. 500g.',                      9.99,  35, $4, TRUE),
       ('BRK-CB-0081', 'Cable de Freno de Mano',         'Cable trasero para freno de mano. Par.',                                          18.50,   0, $2, TRUE),
       ('ELC-BT-70AH', 'Batería 70 Ah',                  'Batería de arranque libre de mantenimiento. 70 Ah / 600 CCA.',                   115.00,  10, $5, TRUE),
       ('ELC-AL-1200', 'Alternador Remanufacturado',      'Alternador 120A remanufacturado con garantía 12 meses.',                         220.00,   4, $5, TRUE),
       ('ELC-SN-9050', 'Sensor MAP',                      'Sensor de presión absoluta del colector. OEM compatible.',                        45.00,   7, $5, TRUE),
       ('MOT-JK-0880', 'Junta de Culata',                 'Junta multicapa de acero. Espesor 1.2 mm.',                                       62.00,   6, $6, TRUE),
       ('MOT-TK-DIST', 'Kit de Distribución',             'Incluye correa, tensor y polea. Compatible 1.6L DOHC.',                          88.50,   9, $6, TRUE),
       ('SUS-BU-0320', 'Buje de Horquilla Delantera',    'Buje de poliuretano reforzado. Par.',                                              14.00,  22, $3, TRUE)
     ON CONFLICT (sku) DO NOTHING`,
    [filtros, frenos, suspension, lubricantes, electrico, motor],
  );

  const productos = await dataSource.query<Array<{ id_producto: number; sku: string }>>(
    `SELECT id_producto, sku FROM productos`,
  );
  const prodBySku = Object.fromEntries(productos.map((p) => [p.sku, p.id_producto]));

  console.info(`✓ Productos: ${productos.length} registros`);

  // ── 6. Fichas técnicas ────────────────────────────────────────────────────
  const fichas: Array<[number, string, string]> = [
    [prodBySku['HYK-OF-2631'], 'Rosca', 'M20 x 1.5'],
    [prodBySku['HYK-OF-2631'], 'Diámetro exterior', '76 mm'],
    [prodBySku['HYK-OF-2631'], 'Altura', '86 mm'],
    [prodBySku['HYK-AF-5521'], 'Longitud', '280 mm'],
    [prodBySku['HYK-AF-5521'], 'Ancho', '175 mm'],
    [prodBySku['HYK-AF-5521'], 'Altura', '45 mm'],
    [prodBySku['BRK-PP-4481'], 'Material', 'Semimetálico'],
    [prodBySku['BRK-PP-4481'], 'Posición', 'Delantero'],
    [prodBySku['BRK-PP-4481'], 'Espesor', '15 mm'],
    [prodBySku['BRK-RR-3391'], 'Diámetro', '280 mm'],
    [prodBySku['BRK-RR-3391'], 'Tipo', 'Ventilado'],
    [prodBySku['LUB-ME-5W30'], 'Viscosidad', '5W-30'],
    [prodBySku['LUB-ME-5W30'], 'Tipo', 'Sintético 100%'],
    [prodBySku['LUB-ME-5W30'], 'Volumen', '4L'],
    [prodBySku['ELC-BT-70AH'], 'Capacidad', '70 Ah'],
    [prodBySku['ELC-BT-70AH'], 'CCA', '600 A'],
    [prodBySku['ELC-BT-70AH'], 'Voltaje', '12V'],
    [prodBySku['MOT-TK-DIST'], 'Compatibilidad', '1.6L DOHC'],
    [prodBySku['MOT-TK-DIST'], 'Contenido', 'Correa, tensor, polea'],
  ];

  for (const [idProducto, atributo, valor] of fichas) {
    await dataSource.query(
      `INSERT INTO fichas_tecnicas (id_producto, atributo, valor)
       SELECT $1::int, $2::varchar, $3::varchar
       WHERE NOT EXISTS (
         SELECT 1 FROM fichas_tecnicas WHERE id_producto=$1::int AND atributo=$2::varchar
       )`,
      [idProducto, atributo, valor],
    );
  }

  console.info(`✓ Fichas técnicas: ${fichas.length} atributos`);

  // ── 7. Compatibilidades ───────────────────────────────────────────────────
  // La tabla real usa columnas de texto (marca, modelo) + rango de años,
  // no FKs a la tabla modelos.
  const compat: Array<[string, string, string, number, number]> = [
    // [sku, marca, modelo, año_inicio, año_fin]
    ['HYK-OF-2631', 'Toyota', 'Corolla', 2015, 2023],
    ['HYK-OF-2631', 'Hyundai', 'Elantra', 2017, 2023],
    ['HYK-OF-2631', 'Kia', 'Rio', 2016, 2022],
    ['HYK-OF-2631', 'Nissan', 'Sentra', 2015, 2022],
    ['HYK-AF-5521', 'Toyota', 'Corolla', 2015, 2023],
    ['HYK-AF-5521', 'Hyundai', 'Elantra', 2017, 2023],
    ['HYK-AF-5521', 'Hyundai', 'Tucson', 2018, 2024],
    ['BRK-PP-4481', 'Toyota', 'Corolla', 2015, 2023],
    ['BRK-PP-4481', 'Hyundai', 'Elantra', 2017, 2023],
    ['BRK-PP-4481', 'Kia', 'Rio', 2016, 2022],
    ['BRK-PP-4481', 'Chevrolet', 'Sail', 2015, 2021],
    ['SUS-SH-7721', 'Toyota', 'Corolla', 2015, 2023],
    ['SUS-SH-7721', 'Nissan', 'Sentra', 2015, 2022],
    ['MOT-TK-DIST', 'Kia', 'Rio', 2016, 2022],
    ['MOT-TK-DIST', 'Hyundai', 'Elantra', 2017, 2023],
    ['LUB-ME-5W30', 'Toyota', 'Corolla', 2015, 2023],
    ['LUB-ME-5W30', 'Toyota', 'Hilux', 2016, 2024],
    ['LUB-ME-5W30', 'Hyundai', 'Elantra', 2017, 2023],
    ['LUB-ME-5W30', 'Kia', 'Sportage', 2017, 2024],
    ['LUB-ME-5W30', 'Nissan', 'Sentra', 2015, 2022],
    ['ELC-BT-70AH', 'Toyota', 'Hilux', 2016, 2024],
    ['ELC-BT-70AH', 'Hyundai', 'Tucson', 2018, 2024],
    ['ELC-BT-70AH', 'Hyundai', 'Santa Fe', 2019, 2024],
    ['ELC-BT-70AH', 'Chevrolet', 'Captiva', 2018, 2023],
  ];

  for (const [sku, marca, modelo, anioInicio, anioFin] of compat) {
    const idProd = prodBySku[sku];
    if (!idProd) continue;
    await dataSource.query(
      `INSERT INTO compatibilidades (id_producto, marca, modelo, año_inicio, año_fin)
       SELECT $1::int, $2::varchar, $3::varchar, $4::smallint, $5::smallint
       WHERE NOT EXISTS (
         SELECT 1 FROM compatibilidades
         WHERE id_producto=$1::int AND marca=$2::varchar AND modelo=$3::varchar
       )`,
      [idProd, marca, modelo, anioInicio, anioFin],
    );
  }

  console.info(`✓ Compatibilidades: ${compat.length} registros`);

  // ── 8. Vehículos de usuarios ──────────────────────────────────────────────
  await dataSource.query(
    `INSERT INTO vehiculos_usuario
       (id_usuario, id_modelo, alias, anio, placa, kilometraje_actual, kilometraje_diario_promedio)
     VALUES
       ($1, $4, 'Mi Corolla',  2019, 'ABC-1234', 87500, 30),
       ($1, $5, 'La Hilux',    2021, 'XYZ-9988', 42000, 55),
       ($2, $6, 'Tucson',      2022, 'DEF-4567', 31000, 25),
       ($3, $7, 'Rio Azul',    2020, 'GHI-7890',  9800, 18)
     ON CONFLICT (placa) DO NOTHING`,
    [
      idCliente1,
      idCliente2,
      idCliente3,
      modeloByNombre['Corolla'],
      modeloByNombre['Hilux'],
      modeloByNombre['Tucson'],
      modeloByNombre['Rio'],
    ],
  );

  console.info('✓ Vehículos de usuario: 4 registros');

  // ── 9. Guías y tareas de mantenimiento ────────────────────────────────────
  // Guía para Corolla
  const [guiaCorolla] = await dataSource.query<Array<{ id_guia: number }>>(
    `INSERT INTO guias_mantenimiento (id_modelo, descripcion)
     SELECT $1, $2 WHERE NOT EXISTS (
       SELECT 1 FROM guias_mantenimiento WHERE id_modelo = $1
     ) RETURNING id_guia`,
    [modeloByNombre['Corolla'], 'Plan de mantenimiento preventivo Toyota Corolla 1.8L'],
  );

  const [guiaElantra] = await dataSource.query<Array<{ id_guia: number }>>(
    `INSERT INTO guias_mantenimiento (id_modelo, descripcion)
     SELECT $1, $2 WHERE NOT EXISTS (
       SELECT 1 FROM guias_mantenimiento WHERE id_modelo = $1
     ) RETURNING id_guia`,
    [modeloByNombre['Elantra'], 'Plan de mantenimiento preventivo Hyundai Elantra 1.6L'],
  );

  if (guiaCorolla) {
    const idGuia = guiaCorolla.id_guia;

    const [t1] = await dataSource.query<Array<{ id_tarea: number }>>(
      `INSERT INTO tareas_mantenimiento (id_guia, descripcion_tarea, intervalo_kilometraje, es_critica)
       VALUES ($1, 'Cambio de aceite y filtro',          5000,  TRUE) RETURNING id_tarea`,
      [idGuia],
    );
    const [t2] = await dataSource.query<Array<{ id_tarea: number }>>(
      `INSERT INTO tareas_mantenimiento (id_guia, descripcion_tarea, intervalo_kilometraje, es_critica)
       VALUES ($1, 'Revisión pastillas de freno',        10000, TRUE) RETURNING id_tarea`,
      [idGuia],
    );
    const [t3] = await dataSource.query<Array<{ id_tarea: number }>>(
      `INSERT INTO tareas_mantenimiento (id_guia, descripcion_tarea, intervalo_kilometraje, es_critica)
       VALUES ($1, 'Cambio filtro de aire',              15000, FALSE) RETURNING id_tarea`,
      [idGuia],
    );
    const [t4] = await dataSource.query<Array<{ id_tarea: number }>>(
      `INSERT INTO tareas_mantenimiento (id_guia, descripcion_tarea, intervalo_kilometraje, es_critica)
       VALUES ($1, 'Cambio kit de distribución',        60000, TRUE) RETURNING id_tarea`,
      [idGuia],
    );

    // productos_tarea (idempotente con DO NOTHING)
    await dataSource.query(
      `INSERT INTO productos_tarea (id_tarea, id_producto, cantidad) VALUES
         ($1, $5, 1), ($1, $6, 1),
         ($2, $7, 1),
         ($3, $8, 1),
         ($4, $9, 1)
       ON CONFLICT DO NOTHING`,
      [
        t1.id_tarea,
        t2.id_tarea,
        t3.id_tarea,
        t4.id_tarea,
        prodBySku['LUB-ME-5W30'],
        prodBySku['HYK-OF-2631'],
        prodBySku['BRK-PP-4481'],
        prodBySku['HYK-AF-5521'],
        prodBySku['MOT-TK-DIST'],
      ],
    );

    // Historial para el Corolla de cliente1
    const vehRows = await dataSource.query<Array<{ id_vehiculo_usuario: number }>>(
      `SELECT id_vehiculo_usuario FROM vehiculos_usuario WHERE placa = 'ABC-1234' LIMIT 1`,
    );
    if (vehRows.length) {
      const idVeh = vehRows[0].id_vehiculo_usuario;
      await dataSource.query(
        `INSERT INTO historial_mantenimiento
           (id_vehiculo_usuario, id_tarea, fecha_servicio, kilometraje_servicio, comentarios)
         VALUES
           ($1, $2, '2025-03-15', 75000, 'Cambio aceite 5W-30 sintético + filtro aceite HYK'),
           ($1, $3, '2024-09-10', 65000, 'Revisión frenos OK, pastillas al 40%'),
           ($1, $4, '2024-03-20', 55000, 'Filtro de aire reemplazado')
         ON CONFLICT DO NOTHING`,
        [idVeh, t1.id_tarea, t2.id_tarea, t3.id_tarea],
      );
    }

    console.info('✓ Guía Corolla: 4 tareas + historial');
  }

  if (guiaElantra) {
    const idGuia = guiaElantra.id_guia;
    await dataSource.query(
      `INSERT INTO tareas_mantenimiento (id_guia, descripcion_tarea, intervalo_kilometraje, es_critica)
       VALUES
         ($1, 'Cambio de aceite y filtro',        5000,  TRUE),
         ($1, 'Cambio filtro de combustible',     20000, FALSE),
         ($1, 'Revisión sistema eléctrico',       30000, FALSE)`,
      [idGuia],
    );
    console.info('✓ Guía Elantra: 3 tareas');
  }

  // ── 10. Imágenes de producto (URLs de placeholder) ─────────────────────────
  const imagenes: Array<[number, string, boolean]> = [
    [prodBySku['HYK-OF-2631'], 'https://placehold.co/600x400?text=Filtro+Aceite', true],
    [prodBySku['HYK-AF-5521'], 'https://placehold.co/600x400?text=Filtro+Aire', true],
    [prodBySku['BRK-PP-4481'], 'https://placehold.co/600x400?text=Pastillas+Freno', true],
    [prodBySku['BRK-RR-3391'], 'https://placehold.co/600x400?text=Rotor+Freno', true],
    [prodBySku['LUB-ME-5W30'], 'https://placehold.co/600x400?text=Aceite+Motor', true],
    [prodBySku['ELC-BT-70AH'], 'https://placehold.co/600x400?text=Bateria', true],
    [prodBySku['MOT-TK-DIST'], 'https://placehold.co/600x400?text=Kit+Distribucion', true],
    [prodBySku['SUS-SH-7721'], 'https://placehold.co/600x400?text=Amortiguador', true],
  ];

  for (const [idProducto, url, esPrincipal] of imagenes) {
    await dataSource.query(
      `INSERT INTO imagenes_producto (id_producto, url_imagen, es_principal)
       SELECT $1::int, $2::text, $3::boolean
       WHERE NOT EXISTS (
         SELECT 1 FROM imagenes_producto WHERE id_producto=$1::int AND url_imagen=$2::text
       )`,
      [idProducto, url, esPrincipal],
    );
  }

  console.info(`✓ Imágenes: ${imagenes.length} registros`);

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.info('\n🌱 Seed completado con éxito.\n');
  console.info('Credenciales:');
  console.info('  admin@kore.dev      → Admin1234        (Administrador)');
  console.info('  asesor@kore.dev     → Asesor1234       (Asesor Comercial)');
  console.info('  cliente1@kore.dev   → Cliente1234      (Cliente — 2 vehículos)');
  console.info('  cliente2@kore.dev   → Cliente1234      (Cliente — 1 vehículo)');
  console.info('  cliente3@kore.dev   → Cliente1234      (Cliente — 1 vehículo)');

  await dataSource.destroy();
}

main().catch((e) => {
  console.error('Seed falló:', e);
  process.exit(1);
});
