/**
 * =====================================================================
 * UsersService — Lógica de negocio de los usuarios de Jave Parking
 * ---------------------------------------------------------------------
 * Este servicio es el "cerebro" de /users. El Controller solo recibe la
 * petición y este Service habla con la BD.
 * Controller = entra, Service = piensa, Repository = guarda.
 *
 * Usa TypeORM Repository<User> inyectado con @InjectRepository(User).
 * Ese repositorio ya sabe hacer create, save, find, etc. sobre la tabla users.
 * =====================================================================
 */

import {
  ConflictException, // 409 — cuando algo ya existe (código o email duplicado)
  Injectable, // le dice a Nest que esta clase se puede inyectar en otros lados
  NotFoundException, // 404 — cuando no existe
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

@Injectable() // Nest crea una sola instancia y la comparte
export class UsersService {
  // Nest nos da el repositorio de User automáticamente, porque en
  // users.module.ts pusimos TypeOrmModule.forFeature([User])
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Registrar un usuario
   * 1. Verifica que el código estudiantil no exista
   * 2. Verifica que el email no exista
   * 3. Crea el objeto y lo guarda
   * Si algo ya existe → 409 Conflict
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // ¿Ya hay alguien con ese código estudiantil (8 dígitos)?
    await this.ensureIdIsAvailable(createUserDto.id);

    // ¿Ya hay alguien con ese email?
    await this.ensureEmailIsAvailable(createUserDto.email);

    // create() solo crea el objeto en memoria, no guarda aún
    const user = this.usersRepository.create(createUserDto);

    // save() sí lo guarda en la BD (INSERT)
    return this.usersRepository.save(user);
  }

  /**
   * Listar solo usuarios con cuenta activa
   * Usamos soft delete: nunca borramos de la BD, solo ponemos isActive=false
   * Por eso filtramos isActive=true
   */
  findAll(): Promise<User[]> {
    return this.usersRepository.findBy({ isActive: true });
  }

  /**
   * Buscar un usuario por su código estudiantil, solo si su cuenta está activa
   * Si no existe o fue borrado → 404
   * Este método lo reusan update() y remove() para no repetir código
   */
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id, isActive: true });
    if (!user) {
      // Nest convierte esto en respuesta HTTP 404 automáticamente
      throw new NotFoundException(`El usuario con el código ${id} no existe`);
    }
    return user;
  }

  /**
   * Actualizar datos de un usuario (nombre, email, teléfono o isInside)
   * - Primero busca el usuario (si no existe, 404)
   * - Si cambian el email, verifica que el nuevo no esté usado
   * - Object.assign copia los campos nuevos sobre el objeto viejo
   * - save() hace UPDATE
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id); // reutiliza la validación 404

    // Solo si mandan un email nuevo y es distinto al actual, verifica duplicado
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.ensureEmailIsAvailable(updateUserDto.email);
    }

    // Copia los campos que vienen en el body sobre el usuario encontrado
    Object.assign(user, updateUserDto);

    await this.usersRepository.save(user);

    // Lo volvemos a buscar para responder con todos sus datos
    return this.findOne(id);
  }

  /**
   * "Borrar" con soft delete
   * No hacemos DELETE real, solo ponemos isActive=false
   * Así se conserva el historial y sus carros y pagos no quedan huérfanos
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepository.save(user); // UPDATE users SET isActive=false
  }

  // ===================================================================
  // HELPERS PRIVADOS — validaciones pequeñas reutilizables
  // ===================================================================

  /**
   * ¿El email ya está usado?
   * Si sí, lanza 409. Si no, no hace nada y deja continuar.
   */
  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con este correo electrónico',
      );
    }
  }

  /**
   * ¿El código estudiantil ya está usado?
   * Igual que email pero para el id.
   */
  private async ensureIdIsAvailable(id: string): Promise<void> {
    const existingUser = await this.usersRepository.findOneBy({ id });
    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con este código estudiantil',
      );
    }
  }
}
