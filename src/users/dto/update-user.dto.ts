import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * UpdateUserDto — Datos que se pueden cambiar de un usuario.
 * Todos son opcionales: solo se actualiza lo que se envíe.
 * El id (código estudiantil) no se puede cambiar.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 100) // Nombre: entre 2 y 100 caracteres.
  name?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase()) // Quita espacios y pasa a minúsculas.
  @IsEmail()
  @Length(5, 254)
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,14}$/) // +? prefijo opcional; 7 a 14 dígitos (máx. 15 caracteres).
  phone?: string;

  @IsOptional()
  @IsBoolean() // true = está dentro de la U, false = está afuera
  isInside?: boolean;
}