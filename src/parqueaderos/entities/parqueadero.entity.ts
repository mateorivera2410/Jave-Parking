import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * =====================================================================
 * Parqueadero — Tabla "parqueaderos" de Jave Parking
 * Cada fila es un puesto del parqueadero (1, 2, 3...).
 * Un puesto puede tener varios pagos (parqueaderos 1—N pagos).
 * =====================================================================
 */
@Entity('parqueaderos')
export class Parqueadero {
  @PrimaryColumn({ type: 'integer' }) // Número del puesto, lo pone quien lo crea
  id!: number;

  @Column({ type: 'integer' }) // Tarifa por hora, en pesos
  tarifa!: number;

  @Column({ default: false }) // true = ocupado, false = libre
  isActive!: boolean;

  // =====================================================================
  // RELACIONES — esta entidad es standalone (igual que User).
  // parqueaderos 1—N pagos: la FK parqueaderoId vive en Pago con
  //   @ManyToOne(() => Parqueadero)
  // =====================================================================
}