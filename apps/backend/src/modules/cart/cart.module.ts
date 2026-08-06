import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../products/entities/product.entity';

import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart-item.entity';
import { ShoppingCart } from './entities/shopping-cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingCart, CartItem, Product])],
  controllers: [CartController],
  providers: [CartRepository, CartService],
  exports: [CartService],
})
export class CartModule {}
