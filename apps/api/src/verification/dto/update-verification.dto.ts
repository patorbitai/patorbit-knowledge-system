// apps/api/src/verification/dto/update-verification.dto.ts
import { PartialType } from '@nestjs/swagger';

import { CreateVerificationDto } from './create-verification.dto';

export class UpdateVerificationDto extends PartialType(CreateVerificationDto) {}
