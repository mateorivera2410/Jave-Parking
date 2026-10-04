import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParqueaderosService } from './services/parqueaderos.service';
import { ParqueaderosController } from './controllers/parqueaderos.controller';
import { Parqueadero } from './entities/parqueadero.entity';
import { Pago } from '../pagos/entities/pago.entity';

/**
 * =====================================================================
 * ParqueaderosModule — Jave Parking
 * - imports:     registra las tablas que usa el servicio:
 *                · Parqueadero → la tabla "parqueaderos" (se crea en la BD)
 *                · Pago        → solo para revisar si un puesto tiene facturas
 * - controllers: las rutas HTTP (/parqueaderos).
 * - providers:   la lógica de negocio (ParqueaderosService).
 * =====================================================================
 */
@Module({
  imports: [TypeOrmModule.forFeature([Parqueadero, Pago])],
  controllers: [ParqueaderosController],
  providers: [ParqueaderosService],
})
export class ParqueaderosModule {}