import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

/**
 * =====================================================================
 * UsersController — Jave Parking
 * Recibe las peticiones HTTP sobre los usuarios del parqueadero
 * (estudiantes que registran sus carros para entrar y pagar).
 * Aquí NO va lógica: solo recibe la petición y se la pasa al servicio.
 * Ruta base: /users
 * =====================================================================
 */
@Controller('users')
export class UsersController {
  // Nest crea e inyecta el servicio automáticamente.
  constructor(private readonly usersService: UsersService) {}

  // POST /users → Registrar un usuario nuevo.
  // Body: { id (código estudiantil), name, email, phone }
  // El DTO valida los datos antes de llegar aquí.
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // GET /users → Listar los usuarios con cuenta activa.
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/:id → Buscar un usuario por su código estudiantil.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // PUT /users/:id → Actualizar nombre, email, teléfono
  // o marcar si está dentro de la U (isInside).
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // DELETE /users/:id → Desactivar un usuario (soft delete).
  // No lo borra de la BD: pone isActive = false para conservar
  // su historial de carros y pagos.
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}