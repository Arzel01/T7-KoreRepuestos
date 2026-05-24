/**
 * Roles de usuario del sistema. Valores idénticos al ENUM `user_role`
 * definido en `docker/postgres/init.sql`.
 */
export enum UserRole {
  ADMIN = 'admin',
  CLIENTE = 'cliente',
  ASESOR = 'asesor',
}
