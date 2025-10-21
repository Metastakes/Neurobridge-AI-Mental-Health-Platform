import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DiagnosesService } from './diagnoses.service';

@ApiTags('diagnoses')
@ApiBearerAuth()
@Controller('diagnoses')
export class DiagnosesController {
  constructor(private diagnosesService: DiagnosesService) {}

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return this.diagnosesService.findByPatient(patientId);
  }

  @Post()
  async create(@Body() data: any) {
    return this.diagnosesService.create(data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.diagnosesService.remove(id);
  }
}
