import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = Number(value);

    if (isNaN(val) || !Number.isInteger(val) || val <= 0) {
      throw new BadRequestException('El ID debe ser un número entero positivo');
    }

    return val;
  }
}
