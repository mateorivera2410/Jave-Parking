import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CarrosService } from '../services/carros.service';
import { CreateCarroDto } from '../dto/create-carro.dto';

/**
 * =====================================================================
 * CarrosController — Jave Parking
 * Recibe las peticiones HTTP sobre los carros que los estudiantes
 * registran para entrar al parqueadero.
 * Aquí NO va lógica: solo recibe la petición y se la pasa al servicio.
 * Ruta base: /carros
 * Un carro no se edita: si cambia de dueño, se elimina y se registra de nuevo.
 * =====================================================================
 */
@Controller('carros')
export class CarrosController {
  // Nest crea e inyecta el servicio automáticamente.
  constructor(private readonly carrosService: CarrosService) {}

  // POST /carros → Registrar un carro.
  // Body: { placa, userId (código estudiantil del dueño) }
  @Post()
  create(@Body() createCarroDto: CreateCarroDto) {
    return this.carrosService.create(createCarroDto);
  }

  // GET /carros → Listar todos los carros.
  // GET /carros?userId=12345678 → Solo los carros de ese estudiante.
  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.carrosService.findAll(userId);
  }

  // GET /carros/:placa → Buscar un carro por su placa.
  @Get(':placa')
  findOne(@Param('placa') placa: string) {
    return this.carrosService.findOne(placa);
  }

  // DELETE /carros/:placa → Eliminar un carro (DELETE real).
  @Delete(':placa')
  remove(@Param('placa') placa: string) {
    return this.carrosService.remove(placa);
  }
}