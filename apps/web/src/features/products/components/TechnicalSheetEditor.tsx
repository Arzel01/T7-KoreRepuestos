import { useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { productsApi } from '../server/products.api';

import type { TechnicalSheetEntryResponse } from '@kore/shared';

interface TechnicalSheetEditorProps {
  productId: number;
}

export function TechnicalSheetEditor({ productId }: TechnicalSheetEditorProps): JSX.Element {
  const [entries, setEntries] = useState<TechnicalSheetEntryResponse[]>([]);
  const [draftAttr, setDraftAttr] = useState('');
  const [draftVal, setDraftVal] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .getTechnicalSheet(productId)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleAdd(): Promise<void> {
    if (!draftAttr.trim() || !draftVal.trim()) return;
    setError(null);
    setAdding(true);
    try {
      const entry = await productsApi.addTechnicalSheetEntry(productId, {
        attribute: draftAttr.trim(),
        value: draftVal.trim(),
      });
      setEntries((prev) => [...prev, entry]);
      setDraftAttr('');
      setDraftVal('');
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(entryId: number): Promise<void> {
    try {
      await productsApi.deleteTechnicalSheetEntry(productId, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <div className="border border-ink-700">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-ink-700 bg-ink-900">
              <tr className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-400">
                <th className="px-4 py-2 font-medium">Atributo</th>
                <th className="px-4 py-2 font-medium">Valor</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-ink-700/60">
                  <td className="px-4 py-2 font-mono text-sm text-signal-500">{e.attribute}</td>
                  <td className="px-4 py-2 text-sm text-ink-100">{e.value}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      aria-label="Eliminar entrada"
                      className="font-mono text-xs text-danger-500 hover:text-danger-400"
                      onClick={() => void handleDelete(e.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fila nueva */}
      <div className="flex gap-3">
        <input
          type="text"
          value={draftAttr}
          onChange={(e) => setDraftAttr(e.target.value)}
          placeholder="Atributo (ej. Material)"
          className="input-technical flex-1"
        />
        <input
          type="text"
          value={draftVal}
          onChange={(e) => setDraftVal(e.target.value)}
          placeholder="Valor (ej. Acero inoxidable)"
          className="input-technical flex-1"
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
        />
        <button
          type="button"
          className="btn-primary shrink-0"
          disabled={adding || !draftAttr.trim() || !draftVal.trim()}
          onClick={() => void handleAdd()}
        >
          + Agregar
        </button>
      </div>

      {error && <p className="font-mono text-xs text-danger-500">✕ {error}</p>}
    </div>
  );
}
