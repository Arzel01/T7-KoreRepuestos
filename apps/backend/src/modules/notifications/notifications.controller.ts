import { UpdateNotificationPreferencesDto } from '@kore/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';

import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';
import { NotificationsService } from './notifications.service';

import type { JwtPayload } from '../auth/dto/auth-response.dto';
import type { NotificationPreferencesResponse, NotificationResponse } from '@kore/shared';

/**
 * Centro de notificaciones y preferencias del usuario autenticado (US#2).
 * Protegido por el `JwtAuthGuard` global; todo se acota a `user.sub`.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Preferencias de notificación del usuario.' })
  @ApiResponse({ status: 200 })
  getPreferences(@CurrentUser() user: JwtPayload): Promise<NotificationPreferencesResponse> {
    return this.service.getPreferencesResponse(Number(user.sub));
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Actualizar preferencias de notificación.' })
  @ApiResponse({ status: 200 })
  updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponse> {
    return this.service.updatePreferences(Number(user.sub), dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Cantidad de notificaciones no leídas.' })
  @ApiResponse({ status: 200 })
  async unreadCount(@CurrentUser() user: JwtPayload): Promise<{ count: number }> {
    return { count: await this.service.unreadCount(Number(user.sub)) };
  }

  @Get()
  @ApiOperation({ summary: 'Notificaciones del centro in-app del usuario.' })
  @ApiResponse({ status: 200 })
  list(@CurrentUser() user: JwtPayload): Promise<NotificationResponse[]> {
    return this.service.listForUser(Number(user.sub));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída.' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada.' })
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParsePositiveIntPipe) id: number,
  ): Promise<NotificationResponse> {
    return this.service.markRead(Number(user.sub), id);
  }

  @Post('push-subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Registra la suscripción Web Push del navegador (ADR-0006).' })
  @ApiResponse({ status: 204 })
  registerPushSubscription(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePushSubscriptionDto,
  ): Promise<void> {
    return this.service.addPushSubscription(Number(user.sub), dto);
  }

  @Delete('push-subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Da de baja una suscripción Web Push.' })
  @ApiResponse({ status: 204 })
  unregisterPushSubscription(
    @CurrentUser() user: JwtPayload,
    @Query('endpoint') endpoint: string,
  ): Promise<void> {
    return this.service.removePushSubscription(Number(user.sub), endpoint);
  }
}
