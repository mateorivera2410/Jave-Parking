import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CarrosService } from '../services/carros.service';
import { CreateCarroDto } from '../dto/create-carro.dto';
import { UpdateCarroDto } from '../dto/update-carro.dto';

/**
 * =====================================================================
 * CarrosController — Jave Parking
 * Recibe las peticiones HTTP sobre los carros
 * que los estudiantes registran para entrar al parqueadero.
 * Aquí NO va lógica: solo recibe la petición y se la pasa al servicio.
 * Ruta base: /carros
 * =====================================================================
 */
@Controller('carros')
export class CarrosController {
  // Nest crea e inyecta el servicio automáticamente.
  constructor(private readonly carrosService: CarrosService) {}

  // POST /carros → Registrar un vehículo.
  // Body: { placa, userId (código estudiantil del dueño) }
  @Post()
  create(@Body() createCarroDto: CreateCarroDto) {
    return this.carrosService.create(createCarroDto);
  }

  // GET /carros → Listar todos los vehículos.
  // GET /carros?userId=12345678 → Solo los vehículos de ese estudiante.
  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.carrosService.findAll(userId);
  }

  // GET /carros/:placa → Buscar un vehículo por su placa.
  @Get(':placa')
  findOne(@Param('placa') placa: string) {
    return this.carrosService.findOne(placa);
  }

  // PUT /carros/:placa → Cambiar el dueño del vehículo.
  // Body: { userId }
  @Put(':placa')
  update(
    @Param('placa') placa: string,
    @Body() updateCarroDto: UpdateCarroDto,
  ) {
    return this.carrosService.update(placa, updateCarroDto);
  }

  // DELETE /carros/:placa → Eliminar un vehículo (DELETE real).
  @Delete(':placa')
  remove(@Param('placa') placa: string) {
    return this.carrosService.remove(placa);
  }
}
