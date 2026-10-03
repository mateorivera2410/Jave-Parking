
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('parqueaderos')
export class Parqueadero {
  @PrimaryColumn({ length: 20 })
  id!: number; //numero de parqueaderos

  @Column({ unique: true, length: 254 })
  tarifa!: number; //tarifa cobrada


  @Column({ default: true })
  isActive!: boolean; // parqueadero ocupado/desocupado
}