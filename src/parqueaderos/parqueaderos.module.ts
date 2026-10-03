import { Module } from '@nestjs/common';
import { ParqueaderosService } from './parqueaderos.service';
import { ParqueaderosController } from './parqueaderos.controller';

@Module({
  controllers: [ParqueaderosController],
  providers: [ParqueaderosService],
})
export class ParqueaderosModule {}
