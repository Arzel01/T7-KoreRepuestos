import { ImagenProducto } from './imagen-producto.entity';

describe('ImagenProducto (unit · entidad)', () => {
  function build(overrides: Partial<ImagenProducto> = {}): ImagenProducto {
    const image = new ImagenProducto();
    image.urlImagen = 'https://i.ibb.co/fYp9LS3b/carro.jpg';
    image.esPrincipal = false;
    image.producto = { id: 1 } as any;
    Object.assign(image, overrides);
    return image;
  }

  it('crea una instancia válida con campos mínimos', () => {
    const image = build();

    expect(image.urlImagen).toBe('https://i.ibb.co/fYp9LS3b/carro.jpg');
    expect(image.esPrincipal).toBe(false);
    expect(image.producto).toEqual({ id: 1 });
  });

  it('permite marcar la imagen como principal', () => {
    const image = build({ esPrincipal: true });

    expect(image.esPrincipal).toBe(true);
  });

  it('puede asociarse a un producto existente', () => {
    const image = build({ producto: { id: 42 } as any });

    expect(image.producto.id).toBe(42);
  });
});
