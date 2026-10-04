/**
 * =====================================================================
 * CarrosService — Lógica de negocio de los vehículos de Jave Parking
 * ---------------------------------------------------------------------
 * Este servicio es el "cerebro" de /carros. El Controller solo recibe la
 * petición y este Service habla con la BD.
 * Controller = entra, Service = piensa, Repository = guarda.
 *
 * Usa dos repositorios:
 * - Repository<Carro>: para guardar y buscar vehículos.
 * - Repository<User>: solo para revisar que el dueño exista (la FK).
 * =====================================================================
 */

import {
  ConflictException, // 409 — cuando la placa ya está registrada
  Injectable, // le dice a Nest que esta clase se puede inyectar
  NotFoundException, // 404 — cuando el vehículo o el usuario no existe
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCarroDto } from '../dto/create-carro.dto';
import { UpdateCarroDto } from '../dto/update-carro.dto';
import { Carro } from '../entities/carro.entity';
import { User } from '../../users/entities/user.entity';
import { Pago } from '../../pagos/entities/pago.entity';

@Injectable() // Nest crea una sola instancia y la comparte
export class CarrosService {
  // Nest nos da los dos repositorios automáticamente, porque en
  // carros.module.ts vamos a poner TypeOrmModule.forFeature([Carro, User])
  constructor(
    @InjectRepository(Carro)
    private readonly carrosRepository: Repository<Carro>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
  ) {}

  /**
   * Registrar un vehículo
   * 1. Verifica que la placa no esté registrada (409)
   * 2. Verifica que el dueño exista y tenga cuenta activa (404)
   * 3. Crea el objeto y lo guarda
   */
  async create(createCarroDto: CreateCarroDto): Promise<Carro> {
    // ¿Ya hay un vehículo con esa placa?
    await this.ensurePlacaIsAvailable(createCarroDto.placa);

    // ¿El dueño existe? (esto es lo que hace cumplir la FK userId → users.id)
    await this.ensureUserExists(createCarroDto.userId);

    // create() solo crea el objeto en memoria, save() lo guarda (INSERT)
    const carro = this.carrosRepository.create(createCarroDto);
    await this.carrosRepository.save(carro);

    return this.findOne(carro.placa);
  }

  /**
   * Listar vehículos
   * - GET /carros             → todos los vehículos
   * - GET /carros?userId=...  → solo los vehículos de ese estudiante
   */
  findAll(userId?: string): Promise<Carro[]> {
    if (userId) {
      return this.carrosRepository.findBy({ userId });
    }
    return this.carrosRepository.find();
  }

  /**
   * Buscar un vehículo por su placa
   * Pasa la placa a mayúsculas para que "abc123" encuentre "ABC123"
   * Si no existe → 404
   * Este método lo reusan create(), update() y remove()
   */
  async findOne(placa: string): Promise<Carro> {
    const carro = await this.carrosRepository.findOneBy({
      placa: placa.toUpperCase(),
    });
    if (!carro) {
      throw new NotFoundException(`El vehículo con placa ${placa} no existe`);
    }
    return carro;
  }

  /**
   * Cambiar el dueño de un vehículo
   * - Primero busca el vehículo (si no existe, 404)
   * - Si mandan un nuevo dueño, verifica que exista (404)
   * - Object.assign copia los campos nuevos y save() hace UPDATE
   * - Al final lo vuelve a buscar para responder con todos sus datos
   */
  async update(placa: string, updateCarroDto: UpdateCarroDto): Promise<Carro> {
    const carro = await this.findOne(placa); // reutiliza la validación 404

    // Solo si mandan un dueño nuevo y es distinto al actual, verifica que exista
    if (updateCarroDto.userId && updateCarroDto.userId !== carro.userId) {
      await this.ensureUserExists(updateCarroDto.userId);
    }

    Object.assign(carro, updateCarroDto);
    await this.carrosRepository.save(carro);

    return this.findOne(carro.placa);
  }

  /**
   * Eliminar un vehículo
   * Aquí sí es un DELETE real (carros no tiene isActive).
   * Cuando programemos pagos, agregaremos aquí una validación para no
   * borrar vehículos que ya tengan pagos (RESTRICT).
   */
  async remove(placa: string): Promise<void> {
    const carro = await this.findOne(placa);

    // No se deja borrar un vehículo que ya tenga facturas (RESTRICT en Pago)
    const tieneFacturas = await this.pagosRepository.existsBy({
      placa: carro.placa,
    });
    if (tieneFacturas) {
      throw new ConflictException(
        `No se puede borrar el vehículo ${carro.placa} porque tiene facturas registradas`,
      );
    }

    await this.carrosRepository.remove(carro); // DELETE FROM carros WHERE placa=...
  }

  // ===================================================================
  // HELPERS PRIVADOS — validaciones pequeñas reutilizables
  // ===================================================================

  /**
   * ¿La placa ya está registrada?
   * Si sí, lanza 409. Si no, deja continuar.
   */
  private async ensurePlacaIsAvailable(placa: string): Promise<void> {
    const existingCarro = await this.carrosRepository.findOneBy({ placa });
    if (existingCarro) {
      throw new ConflictException('Ya existe un vehículo con esta placa');
    }
  }

  /**
   * ¿El dueño existe y tiene cuenta activa?
   * Si no, lanza 404. Así no se pueden registrar carros a nombre de
   * usuarios que no existen o que fueron desactivados (soft delete).
   */
  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneBy({
      id: userId,
      isActive: true,
    });
    if (!user) {
      throw new NotFoundException(
        `El usuario con el código ${userId} no existe`,
      );
    }
  }
}