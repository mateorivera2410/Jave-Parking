import { Injectable } from '@nestjs/common';
import { CreateParqueaderoDto } from './dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from './dto/update-parqueadero.dto';

@Injectable()
export class ParqueaderosService {
  create(createParqueaderoDto: CreateParqueaderoDto) {
    return 'This action adds a new parqueadero';
  }

  findAll() {
    return `This action returns all parqueaderos`;
  }

  findOne(id: number) {
    return `This action returns a #${id} parqueadero`;
  }

  update(id: number, updateParqueaderoDto: UpdateParqueaderoDto) {
    return `This action updates a #${id} parqueadero`;
  }

  remove(id: number) {
    return `This action removes a #${id} parqueadero`;
  }
}
