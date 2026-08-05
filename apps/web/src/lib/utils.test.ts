import { describe, expect, it } from 'vitest';

import { sanitizeHighlight } from './utils';

describe('sanitizeHighlight', () => {
  it('conserva las etiquetas <mark> que inserta el backend', () => {
    expect(sanitizeHighlight('Filtro de <mark>aceite</mark>')).toBe(
      'Filtro de <mark>aceite</mark>',
    );
  });

  it('neutraliza cualquier otra etiqueta HTML del texto original', () => {
    expect(sanitizeHighlight('<img src=x onerror=alert(1)> <mark>x</mark>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt; <mark>x</mark>',
    );
  });

  it('escapa ampersands para evitar entidades accidentales', () => {
    expect(sanitizeHighlight('Aceite & <mark>filtro</mark>')).toBe(
      'Aceite &amp; <mark>filtro</mark>',
    );
  });

  it('devuelve el texto tal cual cuando no hay marcas ni HTML', () => {
    expect(sanitizeHighlight('Pastillas de freno')).toBe('Pastillas de freno');
  });
});
