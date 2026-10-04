import { IsInt, Max, Min } from 'class-validator';

/**
 * CreateParqueaderoDto — Datos que se piden para crear un puesto.
 * El puesto siempre empieza libre (isActive = false), por eso no se pide.
 * Si algún campo no cumple, Nest responde 400 sin tocar la BD.
 */
export class CreateParqueaderoDto {
  @IsInt({ message: 'El id debe ser un número entero' })
  @Min(1, { message: 'El id debe ser 1 o mayor' }) // Número del puesto
  id!: number;

  @IsInt({ message: 'La tarifa debe ser un número entero (pesos)' })
  @Min(0, { message: 'La tarifa no puede ser negativa' })
  @Max(1000000, { message: 'La tarifa es demasiado alta' }) // Tarifa por hora
  tarifa!: number;
}