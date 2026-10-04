import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Carro } from '../../carros/entities/carro.entity';
import { Parqueadero } from '../../parqueaderos/entities/parqueadero.entity';

/**
 * Convierte una fecha a texto en hora de Colombia (UTC-5).
 * La BD guarda las horas en UTC (lo normal en sistemas reales);
 * esta función solo cambia cómo se MUESTRAN en las respuestas.
 * Ej: 14:40 UTC → "2026-10-04T09:40:12-05:00"
 * Colombia no tiene horario de verano, así que siempre es -5 horas.
 */
function aHoraColombia(fecha: Date | null): string | null {
  if (!fecha) {
    return null; // horaSalida es null mientras el carro sigue adentro
  }
  const colombia = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
  return colombia.toISOString().slice(0, 19) + '-05:00';
}

/**
 * =====================================================================
 * Pago — Tabla "pagos" de Jave Parking
 * Cada fila es una factura: un carro que entra a un puesto y luego sale.
 * - Al entrar: se guarda la hora de entrada y el puesto queda ocupado.
 * - Al salir:  se guarda la hora de salida, se calcula el total
 *              y se da el permiso de salida (isActive = true).
 * =====================================================================
 */
@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn() // Número de factura: 1, 2, 3... lo pone la BD
  id!: number;

  @Column({ length: 10 }) // FK: placa del carro → carros.placa
  placa!: string;

  @Column({ type: 'integer' }) // FK: número del puesto → parqueaderos.id
  parqueaderoId!: number;

  @CreateDateColumn() // Hora de entrada, la BD la pone sola al crear
  @Transform(({ value }: { value: Date }) => aHoraColombia(value), {
    toPlainOnly: true, // solo al responder, no cambia lo que se guarda
  })
  horaEntrada!: Date;

  @Column({ type: Date, nullable: true }) // Hora de salida, vacía mientras está adentro
  @Transform(({ value }: { value: Date | null }) => aHoraColombia(value), {
    toPlainOnly: true,
  })
  horaSalida!: Date | null;

  @Column({ type: 'integer', nullable: true }) // Total a pagar en pesos, se calcula al salir
  total!: number | null;

  @Column({ default: false }) // Permiso de salida: true = ya pagó y puede salir
  isActive!: boolean;

  // =====================================================================
  // RELACIONES
  // N:1 con Carro — muchos pagos pertenecen a un carro.
  // N:1 con Parqueadero — muchos pagos se hacen en un mismo puesto.
  // - onDelete RESTRICT: no se puede borrar un carro o un puesto
  //   que ya tenga pagos (se perdería el historial de facturas).
  // - @JoinColumn: la FK se guarda en la columna indicada de esta tabla.
  // Carro y Parqueadero no tienen @OneToMany hacia Pago (unidireccional).
  // =====================================================================
  @ManyToOne(() => Carro, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'placa' })
  carro!: Carro;

  @ManyToOne(() => Parqueadero, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parqueaderoId' })
  parqueadero!: Parqueadero;
}