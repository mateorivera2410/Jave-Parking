/**
 * =====================================================================
 * ParqueaderosService — Lógica de negocio de los puestos de Jave Parking
 * Controller = entra, Service = piensa, Repository = guarda.
 * =====================================================================
 */

import {
  ConflictException, // 409 — puesto repetido o con facturas
  Injectable,
  NotFoundException, // 404 — cuando el puesto no existe
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParqueaderoDto } from '../dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from '../dto/update-parqueadero.dto';
import { Parqueadero } from '../entities/parqueadero.entity';
import { Pago } from '../../pagos/entities/pago.entity';

@Injectable()
export class ParqueaderosService {
  // Nest nos da los repositorios porque en parqueaderos.module.ts ponemos
  // TypeOrmModule.forFeature([Parqueadero, Pago])
  // - Repository<Pago>: solo para revisar si un puesto tiene facturas
  constructor(
    @InjectRepository(Parqueadero)
    private readonly parqueaderosRepository: Repository<Parqueadero>,
    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
  ) {}

  /**
   * Crear un puesto
   * 1. Verifica que el número de puesto no exista (409)
   * 2. Lo guarda libre (isActive = false por defecto)
   */
  async create(
    createParqueaderoDto: CreateParqueaderoDto,
  ): Promise<Parqueadero> {
    const existing = await this.parqueaderosRepository.findOneBy({
      id: createParqueaderoDto.id,
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe el puesto ${createParqueaderoDto.id}`,
      );
    }

    const parqueadero =
      this.parqueaderosRepository.create(createParqueaderoDto);
    return this.parqueaderosRepository.save(parqueadero);
  }

  /**
   * Listar puestos
   * - GET /parqueaderos               → todos
   * - GET /parqueaderos?ocupado=false → solo los libres
   * - GET /parqueaderos?ocupado=true  → solo los ocupados
   */
  findAll(ocupado?: boolean): Promise<Parqueadero[]> {
    if (ocupado !== undefined) {
      return this.parqueaderosRepository.find({
        where: { isActive: ocupado },
        order: { id: 'ASC' },
      });
    }
    return this.parqueaderosRepository.find({ order: { id: 'ASC' } });
  }

  /**
   * Buscar un puesto por su número
   * Si no existe → 404. Lo reusan update() y remove().
   */
  async findOne(id: number): Promise<Parqueadero> {
    const parqueadero = await this.parqueaderosRepository.findOneBy({ id });
    if (!parqueadero) {
      throw new NotFoundException(`El puesto ${id} no existe`);
    }
    return parqueadero;
  }

  /**
   * Cambiar la tarifa o marcar el puesto como ocupado/libre
   * - Object.assign copia los campos nuevos y save() hace UPDATE
   * - Al final lo vuelve a buscar para responder con todos sus datos
   */
  async update(
    id: number,
    updateParqueaderoDto: UpdateParqueaderoDto,
  ): Promise<Parqueadero> {
    const parqueadero = await this.findOne(id); // 404 si no existe
    Object.assign(parqueadero, updateParqueaderoDto);
    await this.parqueaderosRepository.save(parqueadero);

    return this.findOne(id);
  }

  /**
   * Eliminar un puesto (DELETE real, no tiene soft delete)
   * - Si el puesto ya tiene facturas, NO se deja borrar (409),
   *   porque se perdería el historial de pagos (RESTRICT en Pago).
   */
  async remove(id: number): Promise<void> {
    const parqueadero = await this.findOne(id);

    const tieneFacturas = await this.pagosRepository.existsBy({
      parqueaderoId: id,
    });
    if (tieneFacturas) {
      throw new ConflictException(
        `No se puede borrar el puesto ${id} porque tiene facturas registradas`,
      );
    }

    await this.parqueaderosRepository.remove(parqueadero);
  }
}