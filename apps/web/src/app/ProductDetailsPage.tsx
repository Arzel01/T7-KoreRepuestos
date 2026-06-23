import { ShoppingCart, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { CompatibilityCheck } from '@/features/catalog/components/CompatibilityCheck';
import { ImageGallery } from '@/features/catalog/components/ImageGallery';
import { RelatedProducts } from '@/features/catalog/components/RelatedProducts';
import { TechnicalSpecifications } from '@/features/catalog/components/TechnicalSpecifications';
import { productsApi } from '@/features/products/server/products.api';
import { extractApiErrorMessage } from '@/lib/api-client';

import type { ProductDetailResponse } from '@kore/shared';

export function ProductDetailsPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const productId = id ? parseInt(id, 10) : null;

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setError('ID de producto inválido');
      setLoading(false);
      return;
    }

    const fetchProduct = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await productsApi.getById(productId);
        setProduct(data);
      } catch (err) {
        const message = extractApiErrorMessage(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchProduct();
  }, [productId]);

  const handleAddToCart = (): void => {
    if (!product) return;
    // TODO: Implement cart functionality
    console.info(`Added ${quantity} of product ${product.id} to cart`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Cargando detalles del producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-600">{error || 'Producto no encontrado'}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Volver al catálogo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInStock = product.stock > 0;
  const isLowStock = isInStock && product.stock < 5;
  const canAddToCart = isInStock && quantity > 0 && quantity <= product.stock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-slate-900"
          >
            ← Volver
          </Button>
          <div className="text-sm font-medium text-slate-500">{product.sku}</div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-slate-600">
          <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors">
            Catálogo
          </button>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-medium">{product.name}</span>
        </nav>

        {/* Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Gallery Section */}
          <div className="lg:col-span-2">
            <ImageGallery images={product.images || []} productName={product.name} />
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            {/* Header Info */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
              <p className="text-slate-600">
                SKU: <span className="font-mono text-slate-700">{product.sku}</span>
              </p>
            </div>

            {/* Compatibility Check */}
            {user && <CompatibilityCheck productId={product.id} categoryId={product.categoryId} />}

            {/* Pricing Card */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Precio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-4xl font-bold text-blue-700">${product.price.toFixed(2)}</div>
                <p className="text-sm text-slate-600">+ Impuesto (IVA no incluido)</p>
              </CardContent>
            </Card>

            {/* Stock Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Estado de stock</span>
                <div className="flex items-center gap-2">
                  {isInStock ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">Disponible</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-700">Sin stock</span>
                    </>
                  )}
                </div>
              </div>

              {isLowStock && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-orange-700 font-medium">
                    Últimas unidades disponibles ({product.stock} en stock)
                  </span>
                </div>
              )}

              {!isLowStock && isInStock && (
                <p className="text-sm text-slate-600">{product.stock} unidades disponibles</p>
              )}
            </div>

            {/* Quantity Selector */}
            {isInStock && (
              <div className="space-y-3">
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
                  Cantidad
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-900 font-bold text-lg"
                  >
                    −
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= product.stock) {
                        setQuantity(val);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-center font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-900 font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="w-full py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isInStock ? 'Añadir al carrito' : 'Sin stock'}
            </Button>

            {/* Wishlist / Share */}
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                className="flex-1 text-slate-900"
                onClick={() => {
                  const url = window.location.href;
                  try {
                    void navigator.clipboard.writeText(url);
                  } catch {
                    const input = document.createElement('input');
                    input.value = url;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                  }
                }}
              >
                Compartir
              </Button>
            </div>
          </div>
        </div>

        {/* Technical Specifications Section */}
        {product.technicalSheet && product.technicalSheet.length > 0 && (
          <div className="mb-12">
            <TechnicalSpecifications entries={product.technicalSheet} />
          </div>
        )}

        {/* Description Section */}
        {product.description && (
          <Card className="mb-12 border-slate-200">
            <CardHeader>
              <CardTitle>Descripción del producto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                {product.description}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Products Section */}
        <div className="mb-12">
          <RelatedProducts currentProductId={product.id} categoryId={product.categoryId} />
        </div>
      </main>
    </div>
  );
}
