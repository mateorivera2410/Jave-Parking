import { Transform } from 'class-transformer';
import { IsInt, IsString, Matches, Min } from 'class-validator';

/**
 * CreatePagoDto — Datos que se piden cuando un carro ENTRA al parqueadero.
 * La hora de entrada la pone la BD, y el total se calcula al salir,
 * por eso no se piden aquí.
 * Si algún campo no cumple, Nest responde 400 sin tocar la BD.
 */
export class CreatePagoDto {
  // Quita espacios y pasa a mayúsculas: " abc123 " → "ABC123"
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}\d{3}$/, {
    message: 'La placa debe tener formato ABC123 (3 letras y 3 números)',
  }) // Placa del carro que entra (debe existir en carros)
  placa!: string;

  @IsInt({ message: 'El parqueaderoId debe ser un número entero' })
  @Min(1, { message: 'El parqueaderoId debe ser 1 o mayor' }) // Puesto donde se parquea
  parqueaderoId!: number;
}