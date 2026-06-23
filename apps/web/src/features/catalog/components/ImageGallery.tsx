import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ImageOff } from 'lucide-react';
import { useState } from 'react';

import type { ProductImageResponse } from '@kore/shared';

interface ImageGalleryProps {
  images: ProductImageResponse[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps): JSX.Element {
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const validImages = images.filter((img) => img.url);
  const hasImages = validImages.length > 0;
  const mainImage = hasImages ? validImages[mainImageIndex] : null;

  const handlePrevious = (): void => {
    if (!hasImages) return;
    setMainImageIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = (): void => {
    if (!hasImages) return;
    setMainImageIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const handleZoom = (e: React.MouseEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
    setIsZoomed(true);
  };

  const handleImageLoad = (index: number): void => {
    setLoadedImages((prev) => new Set([...prev, index]));
  };

  const isImageLoaded = hasImages ? loadedImages.has(mainImageIndex) : false;

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg aspect-square group">
        {hasImages ? (
          <>
            {/* Loading skeleton */}
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse" />
            )}

            {/* Main Image with Zoom */}
            <div
              role="button"
              tabIndex={0}
              className={`relative w-full h-full cursor-zoom-in overflow-hidden ${
                isZoomed ? 'cursor-zoom-out' : ''
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsZoomed(!isZoomed);
                }
              }}
              onMouseMove={isZoomed ? handleZoom : undefined}
              onMouseLeave={() => setIsZoomed(false)}
            >
              <img
                src={mainImage?.url}
                alt={productName}
                loading="lazy"
                onLoad={() => handleImageLoad(mainImageIndex)}
                className={`w-full h-full object-contain transition-transform duration-300 ${
                  isZoomed ? 'scale-200' : 'scale-100'
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : undefined
                }
              />
            </div>

            {/* Navigation Arrows */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-2 rounded-full shadow-lg backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 p-2 rounded-full shadow-lg backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Zoom Indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/70 text-white px-3 py-2 rounded-lg backdrop-blur-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {isZoomed ? (
                <>
                  <ZoomOut className="w-4 h-4" />
                  <span>Reducir zoom</span>
                </>
              ) : (
                <>
                  <ZoomIn className="w-4 h-4" />
                  <span>Ampliar</span>
                </>
              )}
            </div>

            {/* Image Counter */}
            {validImages.length > 1 && (
              <div className="absolute top-4 left-4 bg-slate-900/70 text-white px-3 py-2 rounded-lg backdrop-blur-md text-sm font-semibold">
                {mainImageIndex + 1} / {validImages.length}
              </div>
            )}
          </>
        ) : (
          /* No Image Placeholder */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="text-center">
              <ImageOff className="w-16 h-16 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Imagen no disponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Carousel */}
      {validImages.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
            Galería ({validImages.length} fotos)
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
            {validImages.slice(0, 10).map((image, index) => (
              <button
                key={image.id}
                onClick={() => setMainImageIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all snap-center overflow-hidden group/thumb ${
                  mainImageIndex === index
                    ? 'border-blue-500 ring-2 ring-blue-300 shadow-md'
                    : 'border-slate-300 hover:border-blue-300'
                }`}
              >
                <img
                  src={image.url}
                  alt={`${productName} - thumbnail ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                {image.isPrimary && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                    Principal
                  </div>
                )}
              </button>
            ))}
            {validImages.length > 10 && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500 font-medium">
                +{validImages.length - 10}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
