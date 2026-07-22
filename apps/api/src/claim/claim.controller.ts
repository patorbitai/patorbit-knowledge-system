
import { Body, Controller, Delete, Get, NotFoundException,Param, Patch, Post, UseGuards } from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';
import { type Claim } from '@patorbit/database';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type IdentityService } from '../identity/identity.service';
import { type ClaimService } from './claim.service';
import { type AddTagDto } from './dto/add-tag.dto';
import { type CreateClaimDto } from './dto/create-claim.dto';
import { type UpdateClaimDto } from './dto/update-claim.dto';

@UseGuards(JwtAuthGuard)
@Controller('claims')
export class ClaimController {
    constructor(
        private readonly claimService: ClaimService,
        private readonly identityService: IdentityService,
    ) {}

    @Post()
    async create(@CurrentUser() user: JwtPayload, @Body() createClaimDto: CreateClaimDto): Promise<Claim> {
        const userProfile = await this.identityService.findUserById(user.sub);
        if (!userProfile?.profile?.id) {
            throw new NotFoundException('User profile not found.');
        }
        return this.claimService.create(userProfile.profile.id, createClaimDto);
    }

    @Get('profile/:profileId')
    findAll(@Param('profileId') profileId: string): Promise<Claim[]> {
        return this.claimService.findAll(profileId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Claim> {
        const claim = await this.claimService.findById(id);
        if (!claim) {
            throw new NotFoundException(`Claim with ID ${id} not found`);
        }
        return claim;
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateClaimDto: UpdateClaimDto): Promise<Claim> {
        return this.claimService.update(id, updateClaimDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<Claim> {
        return this.claimService.softDelete(id);
    }

    @Post(':id/tags')
    addTag(@Param('id') claimId: string, @Body() addTagDto: AddTagDto): Promise<Claim> {
        return this.claimService.addTag(claimId, addTagDto.name);
    }

    @Delete(':id/tags/:tagName')
    removeTag(@Param('id') claimId: string, @Param('tagName') tagName: string): Promise<Claim> {
        return this.claimService.removeTag(claimId, tagName);
    }
}
