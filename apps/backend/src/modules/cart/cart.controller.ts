import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { BulkAddCartDto } from './dto/bulk-add-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

import type { JwtPayload } from '../auth/dto/auth-response.dto';
import type { CartResponse, CartSummaryResponse } from '@kore/shared';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Carrito del usuario autenticado con totales (subtotal, IVA, total).' })
  @ApiResponse({ status: 200 })
  getCart(@CurrentUser() user: JwtPayload): Promise<CartResponse> {
    return this.cartService.getCart(Number(user.sub));
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Resumen ligero del carrito (US#21): contadores y totales, sin líneas.',
  })
  @ApiResponse({ status: 200 })
  getSummary(@CurrentUser() user: JwtPayload): Promise<CartSummaryResponse> {
    return this.cartService.getSummary(Number(user.sub));
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Añade un producto (incrementa si ya existe).' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Stock insuficiente.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado o no disponible.' })
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddCartItemDto): Promise<CartResponse> {
    return this.cartService.addItem(Number(user.sub), dto);
  }

  @Post('items/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Alta masiva de productos (US#5 · "Agregar todos los repuestos").',
  })
  @ApiResponse({ status: 201 })
  bulkAdd(@CurrentUser() user: JwtPayload, @Body() dto: BulkAddCartDto): Promise<CartResponse> {
    return this.cartService.bulkAdd(Number(user.sub), dto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Modifica la cantidad de una línea (US#19).' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Stock insuficiente.' })
  @ApiResponse({ status: 404, description: 'Ítem no encontrado.' })
  updateItem(
    @Param('id', new ParseIntPipe()) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    return this.cartService.updateItem(Number(user.sub), id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Elimina una línea del carrito (US#20).' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Ítem no encontrado.' })
  removeItem(
    @Param('id', new ParseIntPipe()) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<CartResponse> {
    return this.cartService.removeItem(Number(user.sub), id);
  }

  @Delete()
  @ApiOperation({ summary: 'Vacía el carrito del usuario.' })
  @ApiResponse({ status: 200 })
  clear(@CurrentUser() user: JwtPayload): Promise<CartResponse> {
    return this.cartService.clear(Number(user.sub));
  }
}
