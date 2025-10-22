import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, SessionReviewDto } from './dto';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
@UseInterceptors(AuditInterceptor) // Audit all patient data access
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all patients' })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.patientsService.findAll(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get patients by provider ID' })
  async findByProvider(@Param('providerId') providerId: string) {
    return this.patientsService.findByProvider(providerId);
  }

  @Get(':id/gamification')
  @ApiOperation({ summary: 'Get patient gamification summary' })
  async getGamificationSummary(@Param('id') id: string) {
    return this.patientsService.getGamificationSummary(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new patient' })
  async create(@Body() data: CreatePatientDto) {
    return this.patientsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient' })
  async update(@Param('id') id: string, @Body() data: UpdatePatientDto) {
    return this.patientsService.update(id, data);
  }

  @Patch(':id/onboarding')
  @ApiOperation({ summary: 'Mark patient onboarding as complete' })
  async completeOnboarding(@Param('id') id: string) {
    return this.patientsService.completeOnboarding(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get patient summary with stats' })
  async getSummary(@Param('id') id: string) {
    return this.patientsService.getSummary(id);
  }

  @Post(':id/session-review')
  @ApiOperation({ summary: 'Submit session review and earn points' })
  async submitSessionReview(
    @Param('id') id: string,
    @Body() review: SessionReviewDto,
  ) {
    return this.patientsService.submitSessionReview(id, review);
  }
}
