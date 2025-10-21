import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto, UpdateMedicationDto } from './dto';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';

@ApiTags('medications')
@ApiBearerAuth()
@Controller('medications')
@UseInterceptors(AuditInterceptor)
export class MedicationsController {
  constructor(private medicationsService: MedicationsService) {}

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all medications for a patient' })
  async findByPatient(@Param('patientId') patientId: string) {
    return this.medicationsService.findByPatient(patientId);
  }

  @Get('patient/:patientId/active')
  @ApiOperation({ summary: 'Get active medications for a patient' })
  async findActive(@Param('patientId') patientId: string) {
    return this.medicationsService.findActive(patientId);
  }

  @Post()
  @ApiOperation({ summary: 'Add new medication' })
  async create(@Body() data: CreateMedicationDto) {
    return this.medicationsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update medication' })
  async update(@Param('id') id: string, @Body() data: UpdateMedicationDto) {
    return this.medicationsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Discontinue medication (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.medicationsService.remove(id);
  }
}
