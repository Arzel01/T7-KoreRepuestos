import 'reflect-metadata';
import * as path from 'path';

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

interface BrandSeed {
  nombre: string;
  modelos: { nombre: string; anioInicio: number; anioFin: number }[];
}

const BRANDS: BrandSeed[] = [
  {
    nombre: 'Toyota',
    modelos: [
      { nombre: 'Corolla', anioInicio: 1993, anioFin: 2026 },
      { nombre: 'Yaris', anioInicio: 2006, anioFin: 2026 },
      { nombre: 'Hilux', anioInicio: 1998, anioFin: 2026 },
      { nombre: 'RAV4', anioInicio: 2000, anioFin: 2026 },
      { nombre: 'Fortuner', anioInicio: 2005, anioFin: 2026 },
      { nombre: 'Prado', anioInicio: 1990, anioFin: 2026 },
    ],
  },
  {
    nombre: 'Nissan',
    modelos: [
      { nombre: 'Sentra', anioInicio: 1990, anioFin: 2026 },
      { nombre: 'Versa', anioInicio: 2007, anioFin: 2026 },
      { nombre: 'Frontier', anioInicio: 1998, anioFin: 2026 },
      { nombre: 'X-Trail', anioInicio: 2002, anioFin: 2026 },
      { nombre: 'Kicks', anioInicio: 2017, anioFin: 2026 },
    ],
  },
  {
    nombre: 'Hyundai',
    modelos: [
      { nombre: 'Accent', anioInicio: 1995, anioFin: 2026 },
      { nombre: 'Elantra', anioInicio: 1992, anioFin: 2026 },
      { nombre: 'Tucson', anioInicio: 2004, anioFin: 2026 },
      { nombre: 'Santa Fe', anioInicio: 2001, anioFin: 2026 },
      { nombre: 'Creta', anioInicio: 2015, anioFin: 2026 },
    ],
  },
  {
    nombre: 'Kia',
    modelos: [
      { nombre: 'Rio', anioInicio: 2000, anioFin: 2026 },
      { nombre: 'Picanto', anioInicio: 2004, anioFin: 2026 },
      { nombre: 'Sportage', anioInicio: 1995, anioFin: 2026 },
      { nombre: 'Sorento', anioInicio: 2002, anioFin: 2026 },
      { nombre: 'Cerato', anioInicio: 2004, anioFin: 2026 },
    ],
  },
  {
    nombre: 'Chevrolet',
    modelos: [
      { nombre: 'Aveo', anioInicio: 2002, anioFin: 2026 },
      { nombre: 'Spark', anioInicio: 2005, anioFin: 2026 },
      { nombre: 'Onix', anioInicio: 2013, anioFin: 2026 },
      { nombre: 'Tracker', anioInicio: 2013, anioFin: 2026 },
      { nombre: 'Sail', anioInicio: 2010, anioFin: 2026 },
    ],
  },
  {
    nombre: 'Suzuki',
    modelos: [
      { nombre: 'Swift', anioInicio: 1990, anioFin: 2026 },
      { nombre: 'Grand Vitara', anioInicio: 1998, anioFin: 2026 },
      { nombre: 'Vitara', anioInicio: 2015, anioFin: 2026 },
      { nombre: 'Jimny', anioInicio: 1998, anioFin: 2026 },
      { nombre: 'S-Cross', anioInicio: 2013, anioFin: 2026 },
    ],
  },
  {
    nombre: 'Mitsubishi',
    modelos: [
      { nombre: 'Lancer', anioInicio: 1991, anioFin: 2017 },
      { nombre: 'L200', anioInicio: 1996, anioFin: 2026 },
      { nombre: 'Montero Sport', anioInicio: 1996, anioFin: 2026 },
      { nombre: 'Outlander', anioInicio: 2003, anioFin: 2026 },
      { nombre: 'ASX', anioInicio: 2010, anioFin: 2026 },
    ],
  },
];

async function run() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  try {
    for (const brand of BRANDS) {
      const row = (await queryRunner.query(`SELECT id_marca FROM public.marcas WHERE nombre = $1`, [
        brand.nombre,
      ])) as { id_marca: number }[];

      let brandId: number;
      if (row.length === 0) {
        const inserted = (await queryRunner.query(
          `INSERT INTO public.marcas (nombre) VALUES ($1) RETURNING id_marca`,
          [brand.nombre],
        )) as { id_marca: number }[];
        brandId = inserted[0].id_marca;
        console.info(`  ✔ Marca insertada: ${brand.nombre} (id=${brandId})`);
      } else {
        brandId = row[0].id_marca;
        console.info(`  · Marca ya existe: ${brand.nombre} (id=${brandId})`);
      }

      for (const m of brand.modelos) {
        const existing = (await queryRunner.query(
          `SELECT id_modelo FROM public.modelos WHERE id_marca = $1 AND nombre = $2`,
          [brandId, m.nombre],
        )) as { id_modelo: number }[];
        if (existing.length === 0) {
          await queryRunner.query(
            `INSERT INTO public.modelos (id_marca, nombre, anio_inicio, anio_fin)
             VALUES ($1, $2, $3, $4)`,
            [brandId, m.nombre, m.anioInicio, m.anioFin],
          );
          console.info(`    ✔ Modelo insertado: ${m.nombre}`);
        } else {
          console.info(`    · Modelo ya existe: ${m.nombre}`);
        }
      }
    }
    console.info('\nSeed completado.');
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
