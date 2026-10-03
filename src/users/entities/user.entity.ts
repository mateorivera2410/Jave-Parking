import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * =====================================================================
 * User — Tabla "users" de Jave Parking
 * Cada fila es un estudiante registrado en la app.
 * Un usuario puede tener varios carros (users 1—N carros).
 * =====================================================================
 */
@Entity('users')
export class User {
  @PrimaryColumn({ length: 8 }) // Código estudiantil (8 dígitos, lo valida el DTO)
  id!: string;

  @Column({ length: 100 }) // Nombre del estudiante
  name!: string;

  @Column({ unique: true, length: 254 }) // Correo, no se puede repetir
  email!: string;

  @Column({ length: 15 }) // Teléfono
  phone!: string;

  @Column({ default: true }) // true = cuenta activa, false = cuenta borrada (soft delete)
  isActive!: boolean;

  @Column({ default: false }) // true = está dentro de la U, false = está afuera
  isInside!: boolean;

  // =====================================================================
  // RELACIONES — esta entidad es standalone (igual que en el seed).
  // users 1—N carros: la FK userId vive en Carro con
  //   @ManyToOne(() => User)
  // User no necesita conocer sus carros; se consultan con
  //   GET /carros?userId=...
  // Se deja unidireccional para evitar imports circulares.
  // =====================================================================
}