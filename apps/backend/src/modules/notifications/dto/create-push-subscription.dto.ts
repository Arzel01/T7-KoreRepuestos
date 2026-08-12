import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';

export class PushSubscriptionKeysDto {
  @ApiProperty({ description: 'Clave pública P-256DH de la suscripción.' })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ description: 'Secreto de autenticación de la suscripción.' })
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

/**
 * Payload de `PushSubscription.toJSON()` del navegador (Web Push, ADR-0006).
 * Validado solo en el backend: `class-transformer`/`@Type` requieren el
 * polyfill global `reflect-metadata` (cargado en `main.ts`), que no existe en
 * el navegador — por eso esta clase vive aquí y no en `@kore/shared`
 * (que sí se bundlea directo en `apps/web`).
 */
export class CreatePushSubscriptionDto {
  @ApiProperty({ description: 'Endpoint del servicio push del navegador.' })
  @IsUrl({ require_tld: false })
  endpoint!: string;

  @ApiProperty({ type: () => PushSubscriptionKeysDto })
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;
}
