import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarrosService } from './services/carros.service';
import { CarrosController } from './controllers/carros.controller';
import { Carro } from './entities/carro.entity';
import { User } from '../users/entities/user.entity';

/**
 * =====================================================================
 * CarrosModule — Jave Parking
 * Agrupa todo lo relacionado con los vehículos del parqueadero:
 * - imports:     registra las tablas que usa el servicio:
 *                · Carro → la tabla "carros" (se crea en la BD)
 *                · User  → solo para revisar que el dueño exista
 * - controllers: las rutas HTTP (/carros).
 * - providers:   la lógica de negocio (CarrosService).
 * =====================================================================
 */
@Module({
  imports: [TypeOrmModule.forFeature([Carro, User])],
  controllers: [CarrosController],
  providers: [CarrosService],
})
export class CarrosModule {}