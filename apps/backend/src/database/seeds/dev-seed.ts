/**
 * Seed de DESARROLLO: categorías y productos de muestra para el catálogo.
 *
 * Idempotente — usa ON CONFLICT DO NOTHING sobre las claves únicas
 * (slug en categorías, sku en productos), así que puede correrse N veces.
 *
 * Uso: pnpm --filter @kore/backend seed:dev
 * (requiere la BD levantada y las migraciones aplicadas)
 */
import dataSource from '../../config/typeorm.config';

interface SeedProduct {
  sku: string;
  name: string;
  description: string;
  categorySlug: string | null;
  brand: string | null;
  price: number;
  stock: number;
  minStock: number;
  imageUrl: string | null;
}

const CATEGORIES = [
  {
    name: 'Filtros',
    slug: 'filtros',
    description: 'Filtros de aire, aceite, combustible y cabina',
  },
  { name: 'Frenos', slug: 'frenos', description: 'Sistema de frenado y componentes asociados' },
  { name: 'Suspensión', slug: 'suspension', description: 'Amortiguadores, espirales y bujes' },
  {
    name: 'Lubricantes',
    slug: 'lubricantes',
    description: 'Aceites y fluidos para motor y transmisión',
  },
];

const img = (seed: string): string => `https://picsum.photos/seed/${seed}/400/300`;

const PRODUCTS: SeedProduct[] = [
  {
    sku: 'HYK-OF-2631123',
    name: 'Filtro de Aceite Premium',
    description:
      'Filtro de aceite de alta eficiencia con válvula antirretorno. Compatible con motores 1.4–2.0L.',
    categorySlug: 'filtros',
    brand: 'Bosch',
    price: 12.99,
    stock: 45,
    minStock: 10,
    imageUrl: img('oil-filter'),
  },
  {
    sku: 'BSH-AF-0986AF',
    name: 'Filtro de Aire Motor',
    description:
      'Elemento filtrante de papel plisado de alto flujo. Reduce el desgaste prematuro del motor.',
    categorySlug: 'filtros',
    brand: 'Bosch',
    price: 18.5,
    stock: 30,
    minStock: 8,
    imageUrl: img('air-filter'),
  },
  {
    sku: 'MAN-CF-1500',
    name: 'Filtro de Cabina Carbón Activado',
    description: 'Retiene polen, polvo y olores. Cambio recomendado cada 15.000 km.',
    categorySlug: 'filtros',
    brand: 'Mann-Filter',
    price: 24.0,
    stock: 0,
    minStock: 5,
    imageUrl: img('cabin-filter'),
  },
  {
    sku: 'BRE-PF-7891',
    name: 'Pastillas de Freno Delanteras',
    description: 'Juego de 4 pastillas cerámicas de bajo ruido y baja generación de polvo.',
    categorySlug: 'frenos',
    brand: 'Brembo',
    price: 65.99,
    stock: 22,
    minStock: 6,
    imageUrl: img('brake-pads'),
  },
  {
    sku: 'BRE-DR-3340',
    name: 'Disco de Freno Ventilado 280mm',
    description: 'Disco ventilado de fundición de alta resistencia térmica. Se vende por unidad.',
    categorySlug: 'frenos',
    brand: 'Brembo',
    price: 89.0,
    stock: 14,
    minStock: 4,
    imageUrl: img('brake-disc'),
  },
  {
    sku: 'ATE-BL-2204',
    name: 'Líquido de Frenos DOT 4',
    description: 'Punto de ebullición seco 230°C. Envase de 1 litro sellado al vacío.',
    categorySlug: 'frenos',
    brand: 'ATE',
    price: 11.25,
    stock: 60,
    minStock: 15,
    imageUrl: null,
  },
  {
    sku: 'KYB-SA-3410',
    name: 'Amortiguador Trasero Gas',
    description:
      'Amortiguador presurizado con nitrógeno. Restaura la altura y el control originales.',
    categorySlug: 'suspension',
    brand: 'KYB',
    price: 78.5,
    stock: 16,
    minStock: 4,
    imageUrl: img('shock-absorber'),
  },
  {
    sku: 'MOO-BJ-K8607',
    name: 'Rótula de Suspensión Inferior',
    description: 'Rótula sellada de por vida con asiento de polímero de baja fricción.',
    categorySlug: 'suspension',
    brand: 'Moog',
    price: 32.75,
    stock: 0,
    minStock: 6,
    imageUrl: img('ball-joint'),
  },
  {
    sku: 'GAT-TB-T43027',
    name: 'Kit Correa de Distribución',
    description: 'Incluye correa, tensor y rodillo guía. Cobertura 60.000 km o 4 años.',
    categorySlug: 'suspension',
    brand: 'Gates',
    price: 145.0,
    stock: 8,
    minStock: 2,
    imageUrl: img('timing-belt'),
  },
  {
    sku: 'CAS-EO-5W30',
    name: 'Aceite Sintético 5W-30 (4L)',
    description:
      'Aceite 100% sintético API SP. Protección en arranque en frío y altas temperaturas.',
    categorySlug: 'lubricantes',
    brand: 'Castrol',
    price: 42.9,
    stock: 35,
    minStock: 10,
    imageUrl: img('engine-oil'),
  },
  {
    sku: 'MOB-ATF-3309',
    name: 'Fluido de Transmisión ATF (1L)',
    description:
      'Fluido para transmisiones automáticas de 4-6 velocidades. Especificación JWS 3309.',
    categorySlug: 'lubricantes',
    brand: 'Mobil',
    price: 16.8,
    stock: 28,
    minStock: 8,
    imageUrl: null,
  },
  {
    sku: 'NGK-SP-BKR6E',
    name: 'Bujía de Encendido Níquel',
    description: 'Bujía estándar de electrodo de níquel. Calibración de fábrica 0.8mm.',
    categorySlug: null,
    brand: 'NGK',
    price: 4.5,
    stock: 120,
    minStock: 30,
    imageUrl: img('spark-plug'),
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    for (const c of CATEGORIES) {
      await dataSource.query(
        `INSERT INTO product_categories (name, slug, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO NOTHING`,
        [c.name, c.slug, c.description],
      );
    }

    for (const p of PRODUCTS) {
      await dataSource.query(
        `INSERT INTO products
           (sku, name, description, category_id, brand, price, stock, min_stock, image_url)
         VALUES
           ($1, $2, $3,
            (SELECT id FROM product_categories WHERE slug = $4),
            $5, $6, $7, $8, $9)
         ON CONFLICT (sku) DO NOTHING`,
        [
          p.sku,
          p.name,
          p.description,
          p.categorySlug,
          p.brand,
          p.price,
          p.stock,
          p.minStock,
          p.imageUrl,
        ],
      );
    }

    const [{ count }] = (await dataSource.query('SELECT COUNT(*)::int AS count FROM products')) as [
      { count: number },
    ];
    console.info(`Seed completado — ${CATEGORIES.length} categorías, ${count} productos en BD.`);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('Seed falló:', err);
  process.exitCode = 1;
});
