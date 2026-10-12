/**
 * =====================================================================
 * PagosService — Lógica de entradas, salidas y cobros de Jave Parking
 * Controller = entra, Service = piensa, Repository = guarda.
 *
 * Usa cuatro repositorios (igual que la plantilla: solo Repository):
 * - Repository<Pago>:        para guardar y buscar facturas.
 * - Repository<Carro>:       para revisar que el carro exista.
 * - Repository<Parqueadero>: para revisar el puesto y ocuparlo/liberarlo.
 * - Repository<User>:        para revisar al dueño y marcarlo dentro/fuera.
 *
 * TRANSACCIONES: la entrada y la salida cambian varias tablas a la vez
 * (pagos, parqueaderos y users). Se hacen dentro de una transacción para
 * que se guarden TODOS los cambios o NINGUNO.
 * =====================================================================
 */

import {
  ConflictException, // 409 — puesto ocupado, carro ya adentro, etc.
  Injectable,
  NotFoundException, // 404 — cuando algo no existe
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { CreatePagoDto } from '../dto/create-pago.dto';
import { Pago } from '../entities/pago.entity';
import { Carro } from '../../carros/entities/carro.entity';
import { Parqueadero } from '../../parqueaderos/entities/parqueadero.entity';
import { User } from '../../users/entities/user.entity';
@Injectable()
export class PagosService {
  // Nest nos da los cuatro repositorios porque en pagos.module.ts ponemos
  // TypeOrmModule.forFeature([Pago, Carro, Parqueadero, User]).
  // DataSource es la conexión a la BD; la usamos para abrir transacciones.
  constructor(
    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
    @InjectRepository(Carro)
    private readonly carrosRepository: Repository<Carro>,
    @InjectRepository(Parqueadero)
    private readonly parqueaderosRepository: Repository<Parqueadero>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ENTRADA — Un carro entra a un puesto
   * 1. Verifica que el carro exista (404)
   * 2. Verifica que el dueño tenga la cuenta activa (409)
   * 3. Verifica que el carro no esté ya adentro (409)
   * 4. Verifica que el puesto exista (404) y esté libre (409)
   * 5. En una transacción: crea la factura, ocupa el puesto y marca
   *    al dueño como "dentro de la U" (isInside = true)
   */
  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const { placa, parqueaderoId } = createPagoDto;

    // 1. ¿El carro existe?
    const carro = await this.carrosRepository.findOneBy({ placa });
    if (!carro) {
      throw new NotFoundException(`El vehículo con placa ${placa} no existe`);
    }
    // 2. ¿El dueño tiene la cuenta activa? (un usuario desactivado no entra)
    const dueno = await this.usersRepository.findOneBy({
      id: carro.userId,
      isActive: true,
    });
    if (!dueno) {
      throw new ConflictException(
        `El dueño del vehículo ${placa} tiene la cuenta desactivada`,
      );
    }

    // 3. ¿El carro ya está adentro? (tiene una factura sin hora de salida)
    const pagoAbierto = await this.pagosRepository.findOneBy({
      placa,
      horaSalida: IsNull(),
    });
    if (pagoAbierto) {
      throw new ConflictException(
        `El vehículo ${placa} ya está adentro (factura ${pagoAbierto.id})`,
      );
    }

    // 4. ¿El puesto existe y está libre?
    const parqueadero = await this.findParqueadero(parqueaderoId);
    if (parqueadero.isActive) {
      throw new ConflictException(`El puesto ${parqueaderoId} está ocupado`);
    }

    // 5. Transacción: los tres cambios se guardan juntos o ninguno.
    //    Dentro se usa "manager" en vez de los repositorios.
    const pago = await this.dataSource.transaction(async (manager) => {
      const nuevoPago = manager.create(Pago, { placa, parqueaderoId });
      await manager.save(nuevoPago); // crea la factura

      parqueadero.isActive = true;
      await manager.save(parqueadero); // ocupa el puesto

      await manager.update(User, { id: dueno.id }, { isInside: true }); // dueño adentro

      return nuevoPago;
    });

    return this.findOne(pago.id);
  }

  /**
   * SALIDA — El carro sale y paga
   * 1. Busca la factura (404) y revisa que no haya salido ya (409)
   * 2. Calcula los minutos: un minuto empezado se cobra completo
   * 3. total = minutos × (tarifa por hora ÷ 60), redondeado a pesos
   *    Ej: 3 min 43 s → 4 min; 4 × 3.500 ÷ 60 = 233,3 → $233
   * 4. En una transacción: cierra la factura, libera el puesto y marca
   *    al dueño como "fuera" (si no tiene otro carro adentro)
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

    // Dueño del carro, para marcarlo "fuera" al final
    const carro = await this.carrosRepository.findOneBy({ placa: pago.placa });

    // 4. Transacción: los cambios se guardan juntos o ninguno
    await this.dataSource.transaction(async (manager) => {
      pago.horaSalida = horaSalida;
      pago.total = total;
      pago.isActive = true; // ya pagó → tiene permiso de salida
      await manager.save(pago); // cierra la factura

      parqueadero.isActive = false;
      await manager.save(parqueadero); // libera el puesto

      if (carro) {
        // ¿El dueño tiene OTRO carro todavía adentro? Si no, queda "fuera".
        const placasDelDueno = (
          await manager.findBy(Carro, { userId: carro.userId })
        ).map((c) => c.placa);
        const otrosAdentro = await manager.countBy(Pago, {
          placa: In(placasDelDueno),
          horaSalida: IsNull(),
        });
        if (otrosAdentro === 0) {
          await manager.update(User, { id: carro.userId }, { isInside: false });
        }
      }
    });

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
