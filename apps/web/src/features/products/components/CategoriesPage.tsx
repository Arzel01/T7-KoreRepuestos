import { useEffect, useState } from 'react';

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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { extractApiErrorMessage } from '@/lib/api-client';

import { categoriesApi } from '../server/products.api';

import type { CategoryResponse } from '@kore/shared';

type TreeNode = CategoryResponse & { children: TreeNode[] };

interface FormState {
  name: string;
  parentId: string;
}

export function CategoriesPage(): JSX.Element {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryResponse | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', parentId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(null);

  function loadTree(): void {
    setLoading(true);
    categoriesApi
      .tree()
      .then((data) => {
        setTree(data as TreeNode[]);
        setLoading(false);
      })
      .catch((err) => {
        setError(extractApiErrorMessage(err));
        setLoading(false);
      });
  }

  useEffect(() => {
    loadTree();
  }, []);

  function openCreate(parentId: number | null = null): void {
    setEditTarget(null);
    setForm({ name: '', parentId: parentId ? String(parentId) : '' });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(cat: CategoryResponse): void {
    setEditTarget(cat);
    setForm({ name: cat.name, parentId: cat.parentId ? String(cat.parentId) : '' });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(): Promise<void> {
    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editTarget) {
        await categoriesApi.update(editTarget.id, {
          name: form.name.trim(),
          parentId: form.parentId ? Number(form.parentId) : undefined,
        });
      } else {
        await categoriesApi.create({
          name: form.name.trim(),
          parentId: form.parentId ? Number(form.parentId) : undefined,
        });
      }
      setDialogOpen(false);
      loadTree();
    } catch (err) {
      setFormError(extractApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(cat: CategoryResponse): Promise<void> {
    try {
      await categoriesApi.remove(cat.id);
      loadTree();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-12 animate-fade-in-up">
      <header className="mb-10 flex items-end justify-between border-b border-ink-700 pb-6">
        <div>
          <p className="eyebrow">Catálogo · 02</p>
          <h1 className="display mt-3 text-display-md">Categorías</h1>
        </div>
        <button type="button" className="btn-primary" onClick={() => openCreate(null)}>
          + Nueva categoría
        </button>
      </header>

      {error && (
        <div className="mb-6 border-l-2 border-danger-500 bg-danger-700/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-danger-500">
          ✕ {error}
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-ink-400">Cargando…</p>
      ) : tree.length === 0 ? (
        <p className="font-mono text-xs text-ink-500">
          ── Aún no hay categorías. Crea la primera. ──
        </p>
      ) : (
        <ul className="space-y-1">
          {tree.map((node) => (
            <CategoryNode
              key={node.id}
              node={node}
              depth={0}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onAddChild={(id) => openCreate(id)}
            />
          ))}
        </ul>
      )}

      {/* Diálogo crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? `Editar "${editTarget.name}"` : 'Nueva categoría'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="category-name"
                className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-400"
              >
                Nombre *
              </label>
              <input
                id="category-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-technical mt-2 w-full"
                onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
              />
            </div>
            {formError && <p className="font-mono text-xs text-danger-500">✕ {formError}</p>}
          </div>
          <DialogFooter>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? 'Guardando…' : editTarget ? 'Guardar' : 'Crear'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo confirmar eliminación */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong>. Solo es posible si no tiene
              subcategorías ni productos activos asociados.
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

interface CategoryNodeProps {
  node: TreeNode;
  depth: number;
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
  onAddChild: (parentId: number) => void;
}

function CategoryNode({
  node,
  depth,
  onEdit,
  onDelete,
  onAddChild,
}: CategoryNodeProps): JSX.Element {
  return (
    <li>
      <div
        className="flex items-center gap-3 border-b border-ink-700/40 py-2 hover:bg-ink-900/50"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <span className="flex-1 text-sm text-ink-100">{node.name}</span>
        {node.children && node.children.length > 0 && (
          <span className="font-mono text-xs text-ink-500">
            {node.children.length} sub{node.children.length === 1 ? '' : 's'}
          </span>
        )}
        <button
          type="button"
          className="font-mono text-xs text-ink-400 hover:text-signal-500"
          onClick={() => onAddChild(node.id)}
        >
          + Sub
        </button>
        <button
          type="button"
          className="font-mono text-xs text-ink-400 hover:text-ink-100"
          onClick={() => onEdit(node)}
        >
          Editar
        </button>
        <button
          type="button"
          className="font-mono text-xs text-danger-500 hover:text-danger-400"
          onClick={() => onDelete(node)}
        >
          Eliminar
        </button>
      </div>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child as TreeNode}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
