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
import { Button } from '@/components/ui/button';
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
      <header className="mb-10 flex items-end justify-between border-b border-border pb-8">
        <div>
          <p className="text-sm font-semibold text-primary">Catálogo · 02</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">Categorías</h1>
        </div>
        <Button onClick={() => openCreate(null)}>+ Nueva categoría</Button>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          ✕ {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : tree.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          ── Aún no hay categorías. Crea la primera. ──
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
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
        </div>
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
                className="block text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Nombre <span className="text-primary">*</span>
              </label>
              <input
                id="category-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-2 h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
              />
            </div>
            {formError && <p className="text-sm text-destructive">✕ {formError}</p>}
          </div>
          <DialogFooter>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
        className="flex items-center gap-3 border-b border-border/60 py-2 hover:bg-muted/30"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <span className="flex-1 text-sm text-foreground">{node.name}</span>
        {node.children && node.children.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {node.children.length} sub{node.children.length === 1 ? '' : 's'}
          </span>
        )}
        <button
          type="button"
          className="text-xs font-medium text-primary hover:text-primary/80"
          onClick={() => onAddChild(node.id)}
        >
          + Sub
        </button>
        <button
          type="button"
          className="text-xs font-medium text-foreground hover:text-primary"
          onClick={() => onEdit(node)}
        >
          Editar
        </button>
        <button
          type="button"
          className="text-xs font-medium text-destructive hover:text-destructive/80"
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
