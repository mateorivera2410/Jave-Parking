import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * UpdateCarroDto — Datos que se pueden cambiar de un vehículo.
 * La placa NO se puede cambiar porque es la llave primaria (PK).
 * Solo se puede cambiar el dueño (ej: si le pasa el carro a otro estudiante).
 */
export class UpdateCarroDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, {
    message: 'El userId debe ser un código estudiantil de 8 dígitos',
  }) // Código estudiantil del nuevo dueño (debe existir en users)
  userId?: string;
}