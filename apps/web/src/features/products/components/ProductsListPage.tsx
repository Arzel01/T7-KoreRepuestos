import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { extractApiErrorMessage } from '@/lib/api-client';

import { categoriesApi, productsApi } from '../server/products.api';

import type { CategoryResponse, ProductResponse } from '@kore/shared';

type SortBy = 'name' | 'price' | 'createdAt';
type StatusFilter = 'all' | 'active' | 'inactive';

interface FlatCategory {
  id: number;
  name: string;
  depth: number;
}

function flattenCategoryTree(nodes: CategoryResponse[], depth = 0): FlatCategory[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenCategoryTree(node.children ?? [], depth + 1),
  ]);
}

export function ProductsListPage(): JSX.Element {
  const [items, setItems] = useState<ProductResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductResponse | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    categoriesApi
      .tree()
      .then((tree) => setFlatCategories(flattenCategoryTree(tree)))
      .catch(() => {});
  }, []);

  function loadProducts(overrides?: {
    search?: string;
    categoryId?: string;
    sortBy?: SortBy;
    sortOrder?: 'asc' | 'desc';
  }): void {
    const s = overrides?.search ?? search;
    const cId = overrides?.categoryId ?? categoryId;
    const sb = overrides?.sortBy ?? sortBy;
    const so = overrides?.sortOrder ?? sortOrder;

    setLoading(true);
    setError(null);
    productsApi
      .list({
        page: 1,
        pageSize: 60,
        search: s || undefined,
        categoryIds: cId ? [cId] : undefined,
        sortBy: sb,
        sortOrder: so,
      })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(extractApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchChange(value: string): void {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadProducts({ search: value }), 300);
  }

  function handleCategoryChange(value: string): void {
    setCategoryId(value);
    loadProducts({ categoryId: value });
  }

  function handleSortByChange(value: SortBy): void {
    setSortBy(value);
    loadProducts({ sortBy: value });
  }

  function toggleSortOrder(): void {
    const next = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(next);
    loadProducts({ sortOrder: next });
  }

  async function handleDelete(product: ProductResponse): Promise<void> {
    try {
      await productsApi.remove(product.id);
      setItems((prev) => prev.filter((p) => p.id !== product.id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  }

  const visibleItems =
    statusFilter === 'all'
      ? items
      : items.filter((p) => (statusFilter === 'active' ? p.isActive : !p.isActive));

  return (
    <div className="mx-auto max-w-7xl px-8 py-12 animate-fade-in-up">
      <header className="mb-6 flex items-end justify-between border-b border-ink-700 pb-6">
        <div>
          <p className="eyebrow">Inventario · 01</p>
          <h1 className="display mt-3 text-display-md">Productos</h1>
          <p className="mt-2 font-mono text-xs text-ink-400">
            {loading ? 'Cargando…' : `${total} ítems registrados`}
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          + Nuevo producto
        </Link>
      </header>

      {/* Barra de filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por nombre o SKU…"
          className="input-technical w-52 text-sm"
        />

        {/* Categoría */}
        <select
          value={categoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="input-technical text-sm"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {flatCategories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {'— '.repeat(c.depth)}
              {c.name}
            </option>
          ))}
        </select>

        {/* Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="input-technical text-sm"
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>

        {/* Ordenar por */}
        <div className="flex items-center gap-1">
          <select
            value={sortBy}
            onChange={(e) => handleSortByChange(e.target.value as SortBy)}
            className="input-technical text-sm"
            aria-label="Ordenar por"
          >
            <option value="createdAt">Fecha creación</option>
            <option value="name">Nombre</option>
            <option value="price">Precio</option>
          </select>
          <button
            type="button"
            onClick={toggleSortOrder}
            title={
              sortOrder === 'asc'
                ? 'Ascendente — haz clic para invertir'
                : 'Descendente — haz clic para invertir'
            }
            className="input-technical px-3 text-sm font-mono"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 border-l-2 border-danger-500 bg-danger-700/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-danger-500">
          ✕ {error}
        </div>
      )}

      <div className="border border-ink-700">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-ink-700 bg-ink-900 text-ink-400">
            <tr className="font-mono text-eyebrow uppercase tracking-eyebrow">
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 text-right font-medium">Precio</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center font-mono text-xs text-ink-500">
                  ──{' '}
                  {search || categoryId || statusFilter !== 'all'
                    ? 'Sin resultados para los filtros actuales.'
                    : 'Aún no hay productos. Cree el primero.'}{' '}
                  ──
                </td>
              </tr>
            )}
            {visibleItems.map((p) => (
              <tr
                key={p.id}
                className="border-b border-ink-700/60 transition-colors hover:bg-ink-900"
              >
                <td className="px-4 py-3 font-mono text-sm text-signal-500">{p.sku}</td>
                <td className="px-4 py-3 text-sm text-ink-100">{p.name}</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-ink-100">
                  S/ {p.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-ink-100">{p.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`tag ${
                      p.isActive
                        ? 'border-success-500/40 text-success-500'
                        : 'border-ink-600 text-ink-400'
                    }`}
                  >
                    {p.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/admin/products/${p.id}/edit`} className="btn-ghost py-1 text-xs">
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="py-1 font-mono text-xs text-danger-500 hover:text-danger-400"
                      onClick={() => setDeleteTarget(p)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              El producto <strong>{deleteTarget?.name}</strong> ({deleteTarget?.sku}) quedará
              inactivo y no aparecerá en el catálogo. Esta acción se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger-700 hover:bg-danger-600"
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
