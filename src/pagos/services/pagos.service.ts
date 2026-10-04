/**
 * =====================================================================
 * PagosService — Lógica de entradas, salidas y cobros de Jave Parking
 * Controller = entra, Service = piensa, Repository = guarda.
 *
 * Usa tres repositorios (igual que la plantilla: solo Repository):
 * - Repository<Pago>:        para guardar y buscar facturas.
 * - Repository<Carro>:       para revisar que el carro exista.
 * - Repository<Parqueadero>: para revisar el puesto y ocuparlo/liberarlo.
 * =====================================================================
 */

import {
  ConflictException, // 409 — puesto ocupado, carro ya adentro, etc.
  Injectable,
  NotFoundException, // 404 — cuando algo no existe
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreatePagoDto } from '../dto/create-pago.dto';
import { Pago } from '../entities/pago.entity';
import { Carro } from '../../carros/entities/carro.entity';
import { Parqueadero } from '../../parqueaderos/entities/parqueadero.entity';

@Injectable()
export class PagosService {
  // Nest nos da los tres repositorios porque en pagos.module.ts ponemos
  // TypeOrmModule.forFeature([Pago, Carro, Parqueadero])
  constructor(
    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
    @InjectRepository(Carro)
    private readonly carrosRepository: Repository<Carro>,
    @InjectRepository(Parqueadero)
    private readonly parqueaderosRepository: Repository<Parqueadero>,
  ) {}

  /**
   * ENTRADA — Un carro entra a un puesto
   * 1. Verifica que el carro exista (404)
   * 2. Verifica que el carro no esté ya adentro (409)
   * 3. Verifica que el puesto exista (404) y esté libre (409)
   * 4. Crea la factura (la hora de entrada la pone la BD)
   * 5. Marca el puesto como ocupado
   */
  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const { placa, parqueaderoId } = createPagoDto;

    // 1. ¿El carro existe?
    const carro = await this.carrosRepository.findOneBy({ placa });
    if (!carro) {
      throw new NotFoundException(`El vehículo con placa ${placa} no existe`);
    }

    // 2. ¿El carro ya está adentro? (tiene una factura sin hora de salida)
    const pagoAbierto = await this.pagosRepository.findOneBy({
      placa,
      horaSalida: IsNull(),
    });
    if (pagoAbierto) {
      throw new ConflictException(
        `El vehículo ${placa} ya está adentro (factura ${pagoAbierto.id})`,
      );
    }

    // 3. ¿El puesto existe y está libre?
    const parqueadero = await this.findParqueadero(parqueaderoId);
    if (parqueadero.isActive) {
      throw new ConflictException(`El puesto ${parqueaderoId} está ocupado`);
    }

    // 4. Crear la factura
    const pago = this.pagosRepository.create({ placa, parqueaderoId });
    await this.pagosRepository.save(pago);

    // 5. Ocupar el puesto
    parqueadero.isActive = true;
    await this.parqueaderosRepository.save(parqueadero);

    return this.findOne(pago.id);
  }

  /**
   * SALIDA — El carro sale y paga
   * 1. Busca la factura (404) y revisa que no haya salido ya (409)
   * 2. Calcula los minutos: un minuto empezado se cobra completo
   * 3. total = minutos × (tarifa por hora ÷ 60), redondeado a pesos
   * 4. Guarda hora de salida, total y permiso de salida
   * 5. Libera el puesto
   */
  async registrarSalida(id: number): Promise<Pago> {
    // 1. ¿La factura existe y sigue abierta?
    const pago = await this.findOne(id);
    if (pago.horaSalida) {
      throw new ConflictException(
        `La factura ${id} ya tiene salida registrada`,
      );
    }

    // 2. Minutos que estuvo adentro (mínimo 1)
    const horaSalida = new Date();
    const milisegundos = horaSalida.getTime() - pago.horaEntrada.getTime();
    const minutos = Math.max(1, Math.ceil(milisegundos / 60000));

    // 3. Calcular el total con la tarifa del puesto
    const parqueadero = await this.findParqueadero(pago.parqueaderoId);
    const total = Math.round((minutos * parqueadero.tarifa) / 60);

    // 4. Cerrar la factura
    pago.horaSalida = horaSalida;
    pago.total = total;
    pago.isActive = true; // ya pagó → tiene permiso de salida
    await this.pagosRepository.save(pago);

    // 5. Liberar el puesto
    parqueadero.isActive = false;
    await this.parqueaderosRepository.save(parqueadero);

    return this.findOne(id);
  }

  /**
   * Listar facturas (las más recientes primero)
   * - GET /pagos              → todas
   * - GET /pagos?placa=ABC123 → solo las de ese carro
   */
  findAll(placa?: string): Promise<Pago[]> {
    if (placa) {
      return this.pagosRepository.find({
        where: { placa: placa.toUpperCase() },
        order: { id: 'DESC' },
      });
    }
    return this.pagosRepository.find({ order: { id: 'DESC' } });
  }

  /**
   * Buscar una factura por su número
   * Si no existe → 404. La reusan create(), registrarSalida() y remove().
   */
  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagosRepository.findOneBy({ id });
    if (!pago) {
      throw new NotFoundException(`La factura ${id} no existe`);
    }
    return pago;
  }

  /**
   * Eliminar una factura (DELETE real)
   * No se deja borrar si el carro sigue adentro, porque el puesto
   * quedaría ocupado para siempre. Primero hay que registrar la salida.
   */
  async remove(id: number): Promise<void> {
    const pago = await this.findOne(id);
    if (!pago.horaSalida) {
      throw new ConflictException(
        `La factura ${id} sigue abierta: registra primero la salida`,
      );
    }
    await this.pagosRepository.remove(pago);
  }

  // ===================================================================
  // HELPERS PRIVADOS
  // ===================================================================

  /**
   * ¿El puesto existe? Si no, lanza 404. Si sí, lo devuelve.
   */
  private async findParqueadero(id: number): Promise<Parqueadero> {
    const parqueadero = await this.parqueaderosRepository.findOneBy({ id });
    if (!parqueadero) {
      throw new NotFoundException(`El puesto ${id} no existe`);
    }
    return parqueadero;
  }
}