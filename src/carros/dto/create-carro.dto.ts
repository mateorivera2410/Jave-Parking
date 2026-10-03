import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

/**
 * CreateCarroDto — Datos que se piden para registrar un vehículo.
 * Si algún campo no cumple, Nest responde 400 sin tocar la BD.
 */
export class CreateCarroDto {
  // Quita espacios y pasa a mayúsculas: " abc123 " → "ABC123"
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}\d{3}$/, {
    message: 'La placa debe tener formato ABC123 (3 letras y 3 números)',
  }) // Solo carros: 3 letras + 3 números
  placa!: string;

  @IsString()
  @Matches(/^\d{8}$/, {
    message: 'El userId debe ser un código estudiantil de 8 dígitos',
  }) // Código estudiantil del dueño (debe existir en users)
  userId!: string;
}