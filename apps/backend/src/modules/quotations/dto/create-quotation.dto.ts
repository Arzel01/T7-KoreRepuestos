import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

import type { CreateQuotationPayload } from '@kore/shared';

/**
 * Alta de cotización (US#22). Todo es opcional: la cotización se arma a partir
 * del carrito vigente del usuario autenticado.
 */
export class CreateQuotationDto implements CreateQuotationPayload {
  @ApiPropertyOptional({
    default: 15,
    minimum: 1,
    maximum: 365,
    description: 'Días de validez de la cotización (por defecto 15).',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  validityDays?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Si es true, envía la cotización por email al usuario tras crearla.',
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional({
    default: true,
    description: 'Si es true (por defecto), vacía el carrito tras emitir la cotización.',
  })
  @IsOptional()
  @IsBoolean()
  clearCart?: boolean;
}
