import { api } from '@/lib/api-client';

import type {
  CartSummaryResponse,
  CreateQuotationPayload,
  QuotationEmailResult,
  QuotationResponse,
  QuotationSummaryResponse,
} from '@kore/shared';

export const quotationsApi = {
  /** US#21 — resumen ligero del carrito (contadores + totales). */
  cartSummary: (): Promise<CartSummaryResponse> => api.get('/cart/summary'),

  /** US#22 — genera una cotización a partir del carrito vigente. */
  create: (payload: CreateQuotationPayload = {}): Promise<QuotationResponse> =>
    api.post('/quotations', payload),

  list: (): Promise<QuotationSummaryResponse[]> => api.get('/quotations'),

  getOne: (id: number): Promise<QuotationResponse> => api.get(`/quotations/${id}`),

  email: (id: number): Promise<QuotationEmailResult> => api.post(`/quotations/${id}/email`),

  /**
   * Descarga el PDF de la cotización. El endpoint exige el JWT, por lo que no
   * puede ser un `<a href>` directo: bajamos el blob autenticado y forzamos la
   * descarga vía un enlace efímero en memoria.
   */
  async downloadPdf(id: number, number: string): Promise<void> {
    const blob = await api.getBlob(`/quotations/${id}/pdf`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${number}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
