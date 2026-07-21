
import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { CareerPassportService } from './career-passport.service';
import { CreateCareerPassportVersionDto } from './dto/create-career-passport-version.dto';

@Controller('career-passport')
export class CareerPassportController {
  constructor(
    private readonly careerPassportService: CareerPassportService,
  ) {}

  @Post(':profileId')
  async createVersion(
    @Param('profileId') profileId: string,
    @Body() dto: CreateCareerPassportVersionDto,
  ) {
    return this.careerPassportService.createVersion(profileId, dto.snapshot);
  }

  @Get('profile/:profileId')
  async findByProfile(@Param('profileId') profileId: string) {
    return this.careerPassportService.findByProfile(profileId);
  }

  @Get('latest/:profileId')
  async getLatest(@Param('profileId') profileId: string) {
    return this.careerPassportService.getLatest(profileId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.careerPassportService.findById(id);
  }

  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    return this.careerPassportService.publish(id);
  }

  @Patch(':id/unpublish')
  async unpublish(@Param('id') id: string) {
    return this.careerPassportService.unpublish(id);
  }
}
