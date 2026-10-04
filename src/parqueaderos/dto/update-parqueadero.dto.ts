import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * UpdateParqueaderoDto — Datos que se pueden cambiar de un puesto.
 * El id NO se puede cambiar porque es la llave primaria (PK).
 * Se puede cambiar la tarifa y marcarlo como ocupado o libre.
 */
export class UpdateParqueaderoDto {
  @IsOptional()
  @IsInt({ message: 'La tarifa debe ser un número entero (pesos)' })
  @Min(0, { message: 'La tarifa no puede ser negativa' })
  @Max(1000000, { message: 'La tarifa es demasiado alta' })
  tarifa?: number;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser true (ocupado) o false (libre)' })
  isActive?: boolean;
}