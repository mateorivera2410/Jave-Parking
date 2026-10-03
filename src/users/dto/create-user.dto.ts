import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
} from 'class-validator';
/**
 * CreateUserDto — Datos que se piden para registrar un usuario.
 * Si algún campo no cumple, Nest responde 400 sin tocar la BD.
 */
export class CreateUserDto {
  @IsString()
  @Matches(/^\d{8}$/) // Código estudiantil: exactamente 8 dígitos.
  id!: string;

  @IsString()
  @Length(2, 100) // Nombre: entre 2 y 100 caracteres.
  name!: string;

  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase()) // Quita espacios y pasa a minúsculas.
  @IsEmail()
  @Length(5, 254)
  email!: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,14}$/) // +? prefijo opcional; 7 a 14 dígitos (máx. 15 caracteres).
  phone!: string;
}
