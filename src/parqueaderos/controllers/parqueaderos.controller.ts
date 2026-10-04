import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ParqueaderosService } from '../services/parqueaderos.service';
import { CreateParqueaderoDto } from '../dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from '../dto/update-parqueadero.dto';

/**
 * =====================================================================
 * ParqueaderosController — Jave Parking
 * Recibe las peticiones HTTP sobre los puestos del parqueadero.
 * Aquí NO va lógica: solo recibe la petición y se la pasa al servicio.
 * Ruta base: /parqueaderos
 * ParseIntPipe convierte el :id de la URL a número (y da 400 si no lo es).
 * =====================================================================
 */
@Controller('parqueaderos')
export class ParqueaderosController {
  constructor(private readonly parqueaderosService: ParqueaderosService) {}

  // POST /parqueaderos → Crear un puesto.
  // Body: { id, tarifa }
  @Post()
  create(@Body() createParqueaderoDto: CreateParqueaderoDto) {
    return this.parqueaderosService.create(createParqueaderoDto);
  }

  // GET /parqueaderos → Listar todos los puestos.
  // GET /parqueaderos?ocupado=false → Solo los libres.
  @Get()
  findAll(
    @Query('ocupado', new ParseBoolPipe({ optional: true })) ocupado?: boolean,
  ) {
    return this.parqueaderosService.findAll(ocupado);
  }

  // GET /parqueaderos/:id → Buscar un puesto por su número.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parqueaderosService.findOne(id);
  }

  // PUT /parqueaderos/:id → Cambiar tarifa u ocupado/libre.
  // Body: { tarifa?, isActive? }
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParqueaderoDto: UpdateParqueaderoDto,
  ) {
    return this.parqueaderosService.update(id, updateParqueaderoDto);
  }

  // DELETE /parqueaderos/:id → Eliminar un puesto.
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.parqueaderosService.remove(id);
  }
}