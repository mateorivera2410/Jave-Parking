import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { PagosService } from '../services/pagos.service';
import { CreatePagoDto } from '../dto/create-pago.dto';

/**
 * =====================================================================
 * PagosController — Jave Parking
 * Recibe las peticiones HTTP de entradas, salidas y facturas.
 * Aquí NO va lógica: solo recibe la petición y se la pasa al servicio.
 * Ruta base: /pagos
 * ClassSerializerInterceptor aplica los @Transform de la entidad Pago
 * antes de responder (así las horas salen en hora de Colombia).
 * =====================================================================
 */
@Controller('pagos')
@UseInterceptors(ClassSerializerInterceptor)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // POST /pagos → Registrar la ENTRADA de un carro a un puesto.
  // Body: { placa, parqueaderoId }
  @Post()
  create(@Body() createPagoDto: CreatePagoDto) {
    return this.pagosService.create(createPagoDto);
  }

  // GET /pagos → Listar todas las facturas.
  // GET /pagos?placa=ABC123 → Solo las facturas de ese carro.
  @Get()
  findAll(@Query('placa') placa?: string) {
    return this.pagosService.findAll(placa);
  }

  // GET /pagos/:id → Buscar una factura por su número.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.findOne(id);
  }

  // PUT /pagos/:id/salida → Registrar la SALIDA: calcula el total,
  // da el permiso de salida y libera el puesto. No lleva Body.
  @Put(':id/salida')
  registrarSalida(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.registrarSalida(id);
  }

  // DELETE /pagos/:id → Eliminar una factura (solo si ya tiene salida).
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.remove(id);
  }
}