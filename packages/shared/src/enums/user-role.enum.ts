/**
 * Roles de usuario del sistema. Valores idénticos al CHECK constraint
 * definido en la tabla `usuarios` del schema real.
 */
export enum UserRole {
  ADMINISTRADOR = 'Administrador',
  ASESOR_COMERCIAL = 'Asesor Comercial',
  CLIENTE = 'Cliente',
}
