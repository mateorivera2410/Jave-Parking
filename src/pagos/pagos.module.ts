import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './services/pagos.service';
import { PagosController } from './controllers/pagos.controller';
import { Pago } from './entities/pago.entity';
import { Carro } from '../carros/entities/carro.entity';
import { Parqueadero } from '../parqueaderos/entities/parqueadero.entity';
import { User } from '../users/entities/user.entity';
/**
 * =====================================================================
 * PagosModule — Jave Parking
 * - imports:     registra las tablas que usa el servicio:
 *                · Pago        → la tabla "pagos" (se crea en la BD)
 *                · Carro       → para revisar que el carro exista
 *                · Parqueadero → para revisar, ocupar y liberar el puesto
 *                · User        → para revisar al dueño y marcarlo dentro/fuera
 * - controllers: las rutas HTTP (/pagos).
 * - providers:   la lógica de negocio (PagosService).
 * =====================================================================
 */
@Module({
  imports: [TypeOrmModule.forFeature([Pago, Carro, Parqueadero, User])],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
