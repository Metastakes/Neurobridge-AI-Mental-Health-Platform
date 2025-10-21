import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EncountersService } from './encounters.service';

@ApiTags('encounters')
@ApiBearerAuth()
@Controller('encounters')
export class EncountersController {
  constructor(private encountersService: EncountersService) {}

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return this.encountersService.findByPatient(patientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.encountersService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.encountersService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.encountersService.update(id, data);
  }

  @Post(':id/case-notes')
  async addCaseNote(
    @Param('id') encounterId: string,
    @Body() data: { providerId: string; note: any },
  ) {
    return this.encountersService.addCaseNote(encounterId, data.providerId, data.note);
  }
}
