// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichText } from './RichText';

describe('RichText', () => {
  it('renderiza etiquetas permitidas (párrafos, negrita, listas)', () => {
    const { container } = render(
      <RichText html="<p>Hola <strong>mundo</strong></p><ul><li>Item</li></ul>" />,
    );
    expect(container.querySelector('strong')?.textContent).toBe('mundo');
    expect(container.querySelector('li')?.textContent).toBe('Item');
  });

  it('elimina <script> y manejadores de eventos inline', () => {
    const dirty = "<p onclick='alert(1)'>Hola<script>alert(1)</script></p>";
    const { container } = render(<RichText html={dirty} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('onclick');
  });

  it('quita atributos href peligrosos (javascript:) pero conserva enlaces normales', () => {
    const { container } = render(
      <RichText html='<a href="javascript:alert(1)">malo</a><a href="https://kore.dev">bueno</a>' />,
    );
    const links = container.querySelectorAll('a');
    // DOMPurify quita el atributo href por completo para esquemas peligrosos
    // (no lo reescribe) — null también es un resultado seguro.
    expect(links[0].getAttribute('href')).not.toBe('javascript:alert(1)');
    expect(links[1].getAttribute('href')).toBe('https://kore.dev');
  });
});
