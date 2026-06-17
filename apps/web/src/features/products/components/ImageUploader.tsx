import { useEffect, useRef, useState } from 'react';

import { extractApiErrorMessage } from '@/lib/api-client';

import { productsApi } from '../server/products.api';

import type { ProductImageResponse } from '@kore/shared';

interface ImageUploaderProps {
  productId: number;
}

export function ImageUploader({ productId }: ImageUploaderProps): JSX.Element {
  const [images, setImages] = useState<ProductImageResponse[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .getImages(productId)
      .then((imgs) => {
        if (!cancelled) setImages(imgs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await productsApi.uploadImage(productId, file);
        setImages((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: number): Promise<void> {
    try {
      await productsApi.deleteImage(productId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-ink-600 p-8 text-center transition-colors hover:border-signal-500 hover:bg-ink-900/50"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="font-mono text-xs uppercase tracking-wider text-ink-400">
          {uploading
            ? 'Subiendo…'
            : 'Arrastra imágenes aquí o haz clic · JPG, PNG, WebP · max 5 MB'}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {error && <p className="font-mono text-xs text-danger-500">✕ {error}</p>}

      {/* Galería */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img) => (
            <div key={img.id} className="group relative border border-ink-700">
              <img
                src={img.url}
                alt=""
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              {img.isPrimary && (
                <span className="absolute bottom-0 left-0 right-0 bg-signal-500/90 px-1 py-0.5 text-center font-mono text-[10px] uppercase tracking-wider text-ink-950">
                  Principal
                </span>
              )}
              <button
                type="button"
                aria-label="Eliminar imagen"
                className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center bg-danger-700 text-white group-hover:flex"
                onClick={() => void handleDelete(img.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
