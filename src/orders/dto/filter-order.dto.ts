import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class FilterOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  // Filtra por usuario (mismo formato que User.id 5-20 dígitos)
  @IsOptional()
  @IsString()
  @Matches(/^\d{5,20}$/)
  userId?: string;
}
