
import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, NotFoundException } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { AddTagDto } from './dto/add-tag.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IdentityService } from '../identity/identity.service';
import { JwtPayload } from '@patorbit/auth';

@UseGuards(JwtAuthGuard)
@Controller('claims')
export class ClaimController {
    constructor(
        private readonly claimService: ClaimService,
        private readonly identityService: IdentityService,
    ) {}

    @Post()
    async create(@CurrentUser() user: JwtPayload, @Body() createClaimDto: CreateClaimDto) {
        const userProfile = await this.identityService.findUserById(user.sub);
        if (!userProfile?.profile?.id) {
            throw new NotFoundException('User profile not found.');
        }
        return this.claimService.create(userProfile.profile.id, createClaimDto);
    }

    @Get('profile/:profileId')
    findAll(@Param('profileId') profileId: string) {
        return this.claimService.findAll(profileId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const claim = await this.claimService.findById(id);
        if (!claim) {
            throw new NotFoundException(`Claim with ID ${id} not found`);
        }
        return claim;
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateClaimDto: UpdateClaimDto) {
        return this.claimService.update(id, updateClaimDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.claimService.softDelete(id);
    }

    @Post(':id/tags')
    addTag(@Param('id') claimId: string, @Body() addTagDto: AddTagDto) {
        return this.claimService.addTag(claimId, addTagDto.name);
    }

    @Delete(':id/tags/:tagName')
    removeTag(@Param('id') claimId: string, @Param('tagName') tagName: string) {
        return this.claimService.removeTag(claimId, tagName);
    }
}
