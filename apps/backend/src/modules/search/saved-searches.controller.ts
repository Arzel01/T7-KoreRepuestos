import { CreateSavedSearchDto } from '@kore/shared';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';

import { SavedSearchesService } from './saved-searches.service';

import type { JwtPayload } from '../auth/dto/auth-response.dto';
import type { SavedSearchResponse } from '@kore/shared';

/**
 * Búsquedas guardadas del usuario autenticado. Protegido por el
 * `JwtAuthGuard` global; cada operación se acota a `user.sub`.
 */
@ApiTags('searches')
@ApiBearerAuth()
@Controller('searches')
export class SavedSearchesController {
  constructor(private readonly service: SavedSearchesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar las búsquedas guardadas del usuario.' })
  @ApiResponse({ status: 200 })
  list(@CurrentUser() user: JwtPayload): Promise<SavedSearchResponse[]> {
    return this.service.list(Number(user.sub));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Guardar una búsqueda (nombre + parámetros).' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: 'Nombre duplicado para el usuario.' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSavedSearchDto,
  ): Promise<SavedSearchResponse> {
    return this.service.create(Number(user.sub), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una búsqueda guardada del usuario.' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'No encontrada o de otro usuario.' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParsePositiveIntPipe) id: number,
  ): Promise<void> {
    return this.service.remove(Number(user.sub), id);
  }
}
