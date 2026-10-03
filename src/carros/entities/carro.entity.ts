import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * =====================================================================
 * Carro — Tabla "carros" de Jave Parking
 * Cada fila es un vehículo registrado por un estudiante.
 * Un usuario puede tener varios carros (users 1—N carros).
 * Un carro puede tener varios pagos (carros 1—N pagos).
 * =====================================================================
 */
@Entity('carros')
export class Carro {
  @PrimaryColumn({ length: 10 }) // Placa del vehículo (ej: ABC123), no se repite
  placa!: string;

  @Column({ length: 8 }) // FK: código estudiantil del dueño → users.id
  userId!: string;

  // =====================================================================
  // RELACIONES
  // N:1 con User — muchos carros pertenecen a un usuario.
  // - @ManyToOne: este carro "apunta" a un User.
  // - onDelete CASCADE: si se borra el usuario de la BD, se borran sus carros.
  //   (Como users usa soft delete, en la práctica nunca se borra de verdad.)
  // - @JoinColumn: la FK se guarda en la columna userId de esta tabla.
  // User no tiene @OneToMany hacia Carro (unidireccional, igual que en el seed).
  // =====================================================================
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}