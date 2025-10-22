import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MentorsService } from './mentors.service';
import { CreateMentorDto, UpdateMentorDto, AssignProviderDto } from './dto';
import { AuditInterceptor } from '../../common/audit/audit.interceptor';

@ApiTags('mentors')
@ApiBearerAuth()
@Controller('mentors')
@UseInterceptors(AuditInterceptor)
export class MentorsController {
  constructor(private mentorsService: MentorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all mentors' })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.mentorsService.findAll(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mentor by ID' })
  async findOne(@Param('id') id: string) {
    return this.mentorsService.findOne(id);
  }

  @Get(':id/mentees')
  @ApiOperation({ summary: 'Get mentor\'s assigned providers (mentees)' })
  async getMentees(@Param('id') id: string) {
    return this.mentorsService.getMentees(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get mentor summary with stats' })
  async getSummary(@Param('id') id: string) {
    return this.mentorsService.getSummary(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new mentor' })
  async create(@Body() data: CreateMentorDto) {
    return this.mentorsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update mentor' })
  async update(@Param('id') id: string, @Body() data: UpdateMentorDto) {
    return this.mentorsService.update(id, data);
  }

  @Post(':id/assign-provider')
  @ApiOperation({ summary: 'Assign a provider to this mentor' })
  async assignProvider(
    @Param('id') mentorId: string,
    @Body() data: AssignProviderDto,
  ) {
    return this.mentorsService.assignProvider(mentorId, data.providerId);
  }

  @Delete(':id/providers/:providerId')
  @ApiOperation({ summary: 'Unassign a provider from this mentor' })
  async unassignProvider(
    @Param('id') mentorId: string,
    @Param('providerId') providerId: string,
  ) {
    return this.mentorsService.unassignProvider(mentorId, providerId);
  }
}
