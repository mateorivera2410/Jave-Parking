import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderDto {
  // Solo permitimos cambiar estado en esta rama didáctica
  // En un caso real se validaría transición PENDING -> PAID/CANCELLED
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
