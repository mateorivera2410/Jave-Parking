import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './services/pagos.service';
import { PagosController } from './controllers/pagos.controller';
import { Pago } from './entities/pago.entity';
import { Carro } from '../carros/entities/carro.entity';
import { Parqueadero } from '../parqueaderos/entities/parqueadero.entity';

/**
 * =====================================================================
 * PagosModule — Jave Parking
 * - imports:     registra las tablas que usa el servicio:
 *                · Pago        → la tabla "pagos" (se crea en la BD)
 *                · Carro       → para revisar que el carro exista
 *                · Parqueadero → para revisar, ocupar y liberar el puesto
 * - controllers: las rutas HTTP (/pagos).
 * - providers:   la lógica de negocio (PagosService).
 * =====================================================================
 */
@Module({
  imports: [TypeOrmModule.forFeature([Pago, Carro, Parqueadero])],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}