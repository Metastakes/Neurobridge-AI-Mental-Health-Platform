import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PharmacologyService } from './pharmacology.service';
import {
  PharmNextStepsDto,
  PharmNextStepsResponseDto,
  CompleteTaskDto,
  CompleteTaskResponseDto,
  PatientTasksResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * Patch 04: Pharmacology Controller
 * AI-powered medication decision support + patient task management
 */
@ApiTags('Pharmacology')
@Controller('pharm')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PharmacologyController {
  constructor(private readonly pharmService: PharmacologyService) {}

  /**
   * POST /pharm/next-steps
   * Provider: Get AI-powered medication recommendations
   */
  @Post('next-steps')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get AI-powered medication recommendations',
    description: 'Provider-facing decision support. Returns ranked medication options based on diagnosis, current meds, allergies, labs, and mood trends.',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommendations generated',
    type: PharmNextStepsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found',
  })
  async getNextSteps(
    @Body() dto: PharmNextStepsDto,
  ): Promise<PharmNextStepsResponseDto> {
    return this.pharmService.getNextSteps(dto);
  }

  /**
   * GET /pharm/tasks/:patientId
   * Patient: Get open pharmacology tasks
   */
  @Get('tasks/:patientId')
  @Roles(UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get patient pharmacology tasks',
    description: 'Returns open tasks (labs, side effect monitoring, education) for patient.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved',
    type: PatientTasksResponseDto,
  })
  async getPatientTasks(
    @Param('patientId') patientId: string,
  ): Promise<PatientTasksResponseDto> {
    return this.pharmService.getPatientTasks(patientId);
  }

  /**
   * POST /pharm/tasks/complete
   * Patient: Mark task as complete
   */
  @Post('tasks/complete')
  @Roles(UserRole.PATIENT, UserRole.PROVIDER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete pharmacology task',
    description: 'Patient marks task as done. Awards points and records completion.',
  })
  @ApiResponse({
    status: 200,
    description: 'Task completed',
    type: CompleteTaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Task already completed or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  async completeTask(
    @Body() dto: CompleteTaskDto & { patientId: string },
  ): Promise<CompleteTaskResponseDto> {
    return this.pharmService.completeTask(dto.patientId, dto);
  }
}
