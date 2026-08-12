import DOMPurify from 'dompurify';

interface RichTextProps {
  /** HTML de un editor de confianza acotada (TipTap admin) — se sanitiza igual antes de inyectar. */
  html: string;
  className?: string;
}

/**
 * Renderiza HTML de `DescriptionEditor` (TipTap: párrafos, negrita, listas).
 * `product.description` es HTML, no texto plano — mostrarlo como string
 * pierde todo el formato y expone las etiquetas escapadas al usuario.
 */
export function RichText({ html, className }: RichTextProps): JSX.Element {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
