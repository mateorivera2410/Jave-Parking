import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';

/**
 * =====================================================================
 * UsersModule — Jave Parking
 * Agrupa todo lo relacionado con los usuarios del parqueadero:
 * - imports:     registra la tabla "users" para poder usarla en el servicio.
 * - controllers: las rutas HTTP (/users).
 * - providers:   la lógica de negocio (UsersService).
 * =====================================================================
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}